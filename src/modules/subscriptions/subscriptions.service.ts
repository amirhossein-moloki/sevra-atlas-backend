import { prisma } from '../../shared/db/prisma';
import { ApiError } from '../../shared/errors/ApiError';
import { EntityType, SubscriptionStatus, PlanTier, Prisma } from '@prisma/client';
import { updateEntityVisibilityScore } from '../../shared/utils/ranking-updater';
import { CacheService } from '../../shared/redis/cache.service';
import { CacheKeys } from '../../shared/redis/cache-keys';

export class SubscriptionsService {
  async listPlans(entityType?: EntityType) {
    return prisma.plan.findMany({
      where: entityType ? { entityType } : {},
      orderBy: { price: 'asc' },
    });
  }

  async assignPlan(targetType: 'SALON' | 'ARTIST', targetId: bigint, planId: bigint, notes?: string, adminId?: bigint) {
    return prisma.$transaction(async (tx) => {
      return this.assignPlanInternal(tx, targetType, targetId, planId, notes || 'Manual plan assignment', adminId, 'MANUAL');
    });
  }

  async assignPlanInternal(
    tx: Prisma.TransactionClient,
    targetType: 'SALON' | 'ARTIST',
    targetId: bigint,
    planId: bigint,
    notes?: string,
    userId?: bigint,
    paymentMethod = 'ZIBAL'
  ) {
    const plan = await tx.plan.findUnique({ where: { id: planId } });
    if (!plan) throw new ApiError(404, 'Plan not found');

    if (plan.entityType !== targetType) {
      throw new ApiError(400, `Plan ${plan.name} is not for ${targetType}`);
    }

    const startDate = new Date();
    const endDate = plan.durationDays > 0 ? new Date(startDate.getTime() + plan.durationDays * 24 * 60 * 60 * 1000) : null;

    const oldSub = await tx.subscription.findUnique({
      where: targetType === 'SALON' ? { salonId: targetId } : { artistId: targetId },
      include: { plan: true },
    });

    const subscription = await tx.subscription.upsert({
      where: targetType === 'SALON' ? { salonId: targetId } : { artistId: targetId },
      update: {
        planId,
        status: SubscriptionStatus.ACTIVE,
        startDate,
        endDate,
        nextBillingDate: endDate,
      },
      create: {
        planId,
        salonId: targetType === 'SALON' ? targetId : null,
        artistId: targetType === 'ARTIST' ? targetId : null,
        status: SubscriptionStatus.ACTIVE,
        startDate,
        endDate,
        nextBillingDate: endDate,
      },
    });

    // Log plan change
    await tx.planChangeLog.create({
      data: {
        targetType: targetType === 'SALON' ? EntityType.SALON : EntityType.ARTIST,
        targetId,
        oldPlanId: oldSub?.planId,
        newPlanId: planId,
        changedBy: userId,
        reason: notes,
      }
    });

    // Track conversion if moving from Free (or no plan) to Paid
    const wasFree = !oldSub || oldSub.plan.price === 0n;
    if (plan.price > 0n && wasFree) {
      await tx.analyticsEvent.create({
        data: {
          eventType: 'CONVERSION',
          entityType: targetType === 'SALON' ? EntityType.SALON : EntityType.ARTIST,
          entityId: targetId,
          metadata: { from: 'FREE', to: plan.tier }
        }
      });
    }

    // Update Salon/Artist record
    if (targetType === 'SALON') {
      await tx.salon.update({
        where: { id: targetId },
        data: {
          planId,
          subscriptionStatus: SubscriptionStatus.ACTIVE,
          featuredUntil: plan.tier === PlanTier.VIP ? endDate : null,
        },
      });
    } else {
      await tx.artist.update({
        where: { id: targetId },
        data: {
          planId,
          subscriptionStatus: SubscriptionStatus.ACTIVE,
          featuredUntil: plan.tier === PlanTier.PRO ? endDate : null, // PRO for artist is "Featured"
        },
      });
    }

    // Record billing history
    await tx.billingHistory.create({
      data: {
        subscriptionId: subscription.id,
        amount: plan.price,
        paymentDate: startDate,
        paymentMethod,
        notes: notes,
      },
    });

    // Recompute score
    await updateEntityVisibilityScore(targetType, targetId);

    // Invalidate cache
    if (targetType === 'SALON') {
      const salon = await tx.salon.findUnique({ where: { id: targetId }, select: { slug: true } });
      if (salon) await CacheService.del(CacheKeys.SALON_DETAIL(salon.slug));
      await CacheService.delByPattern(CacheKeys.SALONS_LIST_PATTERN);
    } else {
      const artist = await tx.artist.findUnique({ where: { id: targetId }, select: { slug: true } });
      if (artist) await CacheService.del(CacheKeys.ARTIST_DETAIL(artist.slug));
      await CacheService.delByPattern(CacheKeys.ARTISTS_LIST_PATTERN);
    }

    return subscription;
  }

  async checkExpirations() {
    const now = new Date();
    const gracePeriodDays = 3;

    // 1. Move ACTIVE to GRACE_PERIOD if expired
    const toGrace = await prisma.subscription.findMany({
      where: {
        status: SubscriptionStatus.ACTIVE,
        endDate: { lt: now },
      },
    });

    for (const sub of toGrace) {
      await prisma.$transaction(async (tx) => {
        await tx.subscription.update({
          where: { id: sub.id },
          data: { status: SubscriptionStatus.GRACE_PERIOD },
        });
        const targetType = sub.salonId ? 'SALON' : 'ARTIST';
        const targetId = sub.salonId || sub.artistId!;
        const updateData = { subscriptionStatus: SubscriptionStatus.GRACE_PERIOD };
        if (targetType === 'SALON') await tx.salon.update({ where: { id: targetId }, data: updateData });
        else await tx.artist.update({ where: { id: targetId }, data: updateData });
      });
    }

    // 2. Move GRACE_PERIOD to EXPIRED if grace period over
    const graceLimit = new Date(now.getTime() - gracePeriodDays * 24 * 60 * 60 * 1000);
    const toExpired = await prisma.subscription.findMany({
      where: {
        status: SubscriptionStatus.GRACE_PERIOD,
        endDate: { lt: graceLimit },
      },
    });

    for (const sub of toExpired) {
      await prisma.$transaction(async (tx) => {
        await tx.subscription.update({
          where: { id: sub.id },
          data: { status: SubscriptionStatus.EXPIRED },
        });

        const targetType = sub.salonId ? 'SALON' : 'ARTIST';
        const targetId = sub.salonId || sub.artistId!;

        if (targetType === 'SALON') {
          await tx.salon.update({
            where: { id: targetId },
            data: { subscriptionStatus: SubscriptionStatus.EXPIRED },
          });
        } else {
          await tx.artist.update({
            where: { id: targetId },
            data: { subscriptionStatus: SubscriptionStatus.EXPIRED },
          });
        }

        await updateEntityVisibilityScore(targetType, targetId);

        // Track Churn
        await tx.analyticsEvent.create({
          data: {
            eventType: 'CHURN',
            entityType: targetType === 'SALON' ? EntityType.SALON : EntityType.ARTIST,
            entityId: targetId,
          }
        });
      });
    }

    return toGrace.length + toExpired.length;
  }

  async getAnalytics() {
    const totalSalons = await prisma.salon.count();
    const paidSalons = await prisma.salon.count({
      where: {
        plan: { price: { gt: 0 } },
        subscriptionStatus: SubscriptionStatus.ACTIVE
      }
    });

    const conversions = await prisma.analyticsEvent.count({ where: { eventType: 'CONVERSION' } });
    const churns = await prisma.analyticsEvent.count({ where: { eventType: 'CHURN' } });

    // Revenue per city (Salons + Artists)
    const revenueByCity = await prisma.$queryRaw`
      SELECT c."nameFa" as city, SUM(bh.amount) as revenue
      FROM billing_history bh
      JOIN billing_subscription bs ON bh.subscription_id = bs.id
      LEFT JOIN "Salon" s ON bs.salon_id = s.id
      LEFT JOIN "Artist" a ON bs.artist_id = a.id
      LEFT JOIN "City" c ON (s.city_id = c.id OR a.city_id = c.id)
      WHERE c.id IS NOT NULL
      GROUP BY c."nameFa"
    `;

    return {
      conversionRate: totalSalons > 0 ? (paidSalons / totalSalons) : 0,
      totalConversions: conversions,
      totalChurns: churns,
      churnRate: (paidSalons + churns) > 0 ? (churns / (paidSalons + churns)) : 0,
      revenueByCity,
    };
  }

  async trackClick(targetType: EntityType, targetId: bigint, metadata: Record<string, unknown> = {}) {
    return prisma.analyticsEvent.create({
      data: {
        eventType: 'CLICK',
        entityType: targetType,
        entityId: targetId,
        metadata: metadata as Prisma.InputJsonValue
      }
    });
  }

  async suspendSubscription(targetType: 'SALON' | 'ARTIST', targetId: bigint) {
    return prisma.$transaction(async (tx) => {
      const subscription = await tx.subscription.update({
        where: targetType === 'SALON' ? { salonId: targetId } : { artistId: targetId },
        data: { status: SubscriptionStatus.CANCELED },
      });

      if (targetType === 'SALON') {
        await tx.salon.update({
          where: { id: targetId },
          data: { subscriptionStatus: SubscriptionStatus.CANCELED },
        });
      } else {
        await tx.artist.update({
          where: { id: targetId },
          data: { subscriptionStatus: SubscriptionStatus.CANCELED },
        });
      }

      await updateEntityVisibilityScore(targetType, targetId);
      return subscription;
    });
  }

  async overrideVisibilityScore(targetType: 'SALON' | 'ARTIST', targetId: bigint, score: number) {
    if (targetType === 'SALON') {
      return prisma.salon.update({
        where: { id: targetId },
        data: { visibilityScore: score },
      });
    } else {
      return prisma.artist.update({
        where: { id: targetId },
        data: { visibilityScore: score },
      });
    }
  }

  async getRevenueStats() {
    const totalRevenue = await prisma.billingHistory.aggregate({
      _sum: { amount: true },
    });

    const revenueByPlan = await prisma.billingHistory.findMany({
      include: {
        subscription: {
          include: { plan: true }
        }
      }
    });

    // Simple grouping in memory for now
    const stats: Record<string, number> = {};
    revenueByPlan.forEach(entry => {
      const planName = entry.subscription.plan.name;
      stats[planName] = (stats[planName] || 0) + Number(entry.amount);
    });

    return {
      totalRevenue: totalRevenue._sum.amount?.toString() || '0',
      revenueByPlan: stats,
    };
  }

  async exportBillingData() {
    return prisma.billingHistory.findMany({
      include: {
        subscription: {
          include: {
            plan: true,
            salon: { select: { name: true } },
            artist: { select: { fullName: true } }
          }
        }
      },
      orderBy: { paymentDate: 'desc' }
    });
  }
}
