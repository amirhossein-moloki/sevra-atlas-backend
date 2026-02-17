import { prisma } from '../../shared/db/prisma';
import { ApiError } from '../../shared/errors/ApiError';
import { handleSlugChange, initSeoMeta } from '../../shared/utils/seo';
import { EntityType, AccountStatus, Prisma } from '@prisma/client';
import { CacheService } from '../../shared/redis/cache.service';
import { CacheKeys } from '../../shared/redis/cache-keys';
import { pickAllowedFields } from '../../shared/utils/object';
import { safeBigInt } from '../../shared/utils/bigint';

export class SalonsService {
  private readonly allowedFields = [
    'name', 'slug', 'summary', 'description', 'phone', 'instagram', 'website',
    'addressLine', 'postalCode', 'lat', 'lng', 'isWomenOnly', 'priceTier',
    'cityId', 'neighborhoodId', 'provinceId', 'avatarMediaId', 'coverMediaId'
  ] as const;

  private readonly publicSalonFields = {
    id: true,
    name: true,
    slug: true,
    summary: true,
    description: true,
    phone: true,
    instagram: true,
    website: true,
    addressLine: true,
    postalCode: true,
    lat: true,
    lng: true,
    isWomenOnly: true,
    priceTier: true,
    avgRating: true,
    reviewCount: true,
    verification: true,
    status: true,
    cityId: true,
    neighborhoodId: true,
    provinceId: true,
    avatarMediaId: true,
    coverMediaId: true,
    seoMetaId: true,
    planId: true,
    subscriptionStatus: true,
    featuredUntil: true,
    createdAt: true,
    updatedAt: true,
  };

  async getSalons(filters: Record<string, unknown>) {
    const cacheKey = CacheKeys.SALONS_LIST(JSON.stringify(filters));

    return CacheService.wrap(cacheKey, async () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { q, province, city, neighborhood, service, verified, minRating, womenOnly, priceTier, minReviewCount, sort, page = 1, pageSize = 20 } = filters as any;
    const limit = parseInt(pageSize as string) || 20;
    const skip = (parseInt(page as string || '1') - 1) * limit;

    const where: Prisma.SalonWhereInput = {
      status: AccountStatus.ACTIVE,
      deletedAt: null,
    };

    if (q) {
      where.OR = [
        { name: { contains: q as string, mode: 'insensitive' } },
        { description: { contains: q as string, mode: 'insensitive' } },
        { summary: { contains: q as string, mode: 'insensitive' } },
      ];
    }

    if (province) where.city = { province: { slug: province as string } };
    if (city) where.city = { ...((where.city as object) || {}), slug: city as string };
    if (neighborhood) where.neighborhood = { slug: neighborhood as string };
    if (service) where.services = { some: { service: { slug: service as string } } };
    if (verified === 'true') where.verification = 'VERIFIED';
    if (minRating) where.avgRating = { gte: parseFloat(minRating as string) };
    if (minReviewCount) where.reviewCount = { gte: parseInt(minReviewCount as string) };
    if (womenOnly === 'true') where.isWomenOnly = true;
    if (priceTier) where.priceTier = parseInt(priceTier as string);

    let orderBy: Prisma.SalonOrderByWithRelationInput = { visibilityScore: 'desc' };
    if (sort === 'rating') orderBy = { avgRating: 'desc' };
    if (sort === 'popular') orderBy = { reviewCount: 'desc' };
    if (sort === 'new') orderBy = { createdAt: 'desc' };

    const [data, total] = await Promise.all([
      prisma.salon.findMany({
        where,
        select: {
          ...this.publicSalonFields,
          avatar: true,
          city: true,
          neighborhood: true,
          plan: true,
        },
        orderBy,
        skip,
        take: limit,
      }),
      prisma.salon.count({ where }),
    ]);

      return {
        data: data,
        meta: { page: parseInt(page as string || '1'), pageSize: limit, total, totalPages: Math.ceil(total / limit) },
      };
    }, 300, { staleWhileRevalidate: 60 });
  }

  async findSalonByIdentifier(identifier: string) {
    const where: Prisma.SalonWhereInput = { deletedAt: null };
    if (!isNaN(Number(identifier))) {
      where.id = safeBigInt(identifier, 'salon_id');
    } else {
      where.slug = identifier;
    }
    return prisma.salon.findFirst({ where });
  }

  async getSalonBySlug(identifier: string) {
    return CacheService.wrap(CacheKeys.SALON_DETAIL(identifier), async () => {
      const where: Prisma.SalonWhereInput = { deletedAt: null };
      if (!isNaN(Number(identifier))) {
        where.id = safeBigInt(identifier, 'salon_id');
      } else {
        where.slug = identifier;
      }

      const salon = await prisma.salon.findFirst({
      where,
      select: {
        ...this.publicSalonFields,
        avatar: true,
        cover: true,
        city: true,
        neighborhood: true,
        services: { include: { service: true } },
        salonArtists: { include: { artist: true } },
        seoMeta: true,
        openingHours: true,
      },
    });

      if (!salon || salon.status !== AccountStatus.ACTIVE) {
        throw new ApiError(404, 'Salon not found');
      }

      return salon;
    }, 1800, { staleWhileRevalidate: 300 });
  }

  async createSalon(data: Record<string, unknown>, userId: bigint) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const safeData = pickAllowedFields(data, [...this.allowedFields]) as any;

    return prisma.$transaction(async (tx) => {
      const salon = await tx.salon.create({
        data: {
          ...safeData,
          cityId: safeData.cityId ? safeBigInt(safeData.cityId, 'cityId') : undefined,
          neighborhoodId: safeData.neighborhoodId ? safeBigInt(safeData.neighborhoodId, 'neighborhoodId') : undefined,
          provinceId: safeData.provinceId ? safeBigInt(safeData.provinceId, 'provinceId') : undefined,
          avatarMediaId: safeData.avatarMediaId ? safeBigInt(safeData.avatarMediaId, 'avatarMediaId') : undefined,
          coverMediaId: safeData.coverMediaId ? safeBigInt(safeData.coverMediaId, 'coverMediaId') : undefined,
          primaryOwnerId: userId,
          owners: { connect: { id: userId } },
        },
      });
      await initSeoMeta(EntityType.SALON, salon.id, salon.name, tx);
      // Invalidate lists and geo stats
      await CacheService.delByPattern(CacheKeys.SALONS_LIST_PATTERN);
      if (salon.cityId) await CacheService.del(CacheKeys.CITY_STATS(salon.cityId));
      return salon;
    });
  }

  private async checkOwnership(tx: Prisma.TransactionClient | typeof prisma, id: bigint, userId: bigint, isAdmin: boolean) {
    const salon = await tx.salon.findUnique({
      where: { id },
      include: { owners: { select: { id: true } } },
    });
    if (!salon) throw new ApiError(404, 'Salon not found');

    const isOwner = salon.owners.some((o: { id: bigint }) => o.id === userId);
    if (!isAdmin && !isOwner) {
      throw new ApiError(403, 'Forbidden');
    }
    return salon;
  }

  async updateSalon(id: bigint, data: Record<string, unknown>, userId: bigint, isAdmin: boolean) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const safeData = pickAllowedFields(data, [...this.allowedFields]) as any;

    return prisma.$transaction(async (tx) => {
      const salon = await this.checkOwnership(tx, id, userId, isAdmin);

      if (safeData.slug && safeData.slug !== salon.slug) {
        await handleSlugChange(EntityType.SALON, id, salon.slug, safeData.slug as string, '/atlas/salon', tx);
      }

      const updatedSalon = await tx.salon.update({
        where: { id },
        data: {
          ...safeData,
          cityId: safeData.cityId ? safeBigInt(safeData.cityId, 'cityId') : undefined,
          neighborhoodId: safeData.neighborhoodId ? safeBigInt(safeData.neighborhoodId, 'neighborhoodId') : undefined,
          provinceId: safeData.provinceId ? safeBigInt(safeData.provinceId, 'provinceId') : undefined,
          avatarMediaId: safeData.avatarMediaId ? safeBigInt(safeData.avatarMediaId, 'avatarMediaId') : undefined,
          coverMediaId: safeData.coverMediaId ? safeBigInt(safeData.coverMediaId, 'coverMediaId') : undefined,
        },
      });

      // Invalidate
      await CacheService.del(CacheKeys.SALON_DETAIL(salon.slug));
      await CacheService.delByPattern(CacheKeys.SALONS_LIST_PATTERN);
      return updatedSalon;
    });
  }

  async deleteSalon(id: bigint, userId: bigint, isAdmin: boolean) {
    await this.checkOwnership(prisma, id, userId, isAdmin);

    await prisma.salon.update({
      where: { id },
      data: { status: AccountStatus.DELETED, deletedAt: new Date() },
    });
    return { ok: true };
  }

  async assignServices(id: bigint, serviceData: { serviceId: number; notes?: string }[], mode: 'append' | 'replace', userId: bigint, isAdmin: boolean) {
    return prisma.$transaction(async (tx) => {
      await this.checkOwnership(tx, id, userId, isAdmin);

      if (mode === 'replace') {
        await tx.salonService.deleteMany({ where: { salonId: id } });
      }

      for (const item of serviceData) {
        const sId = safeBigInt(item.serviceId, 'serviceId');
        await tx.salonService.upsert({
          where: {
            salonId_serviceId: { salonId: id, serviceId: sId },
          },
          create: {
            salonId: id,
            serviceId: sId,
            notes: item.notes,
          },
          update: {
            notes: item.notes,
          },
        });
      }
      return { ok: true };
    });
  }

  async removeService(id: bigint, serviceId: bigint, userId: bigint, isAdmin: boolean) {
    await this.checkOwnership(prisma, id, userId, isAdmin);

    await prisma.salonService.delete({
      where: { salonId_serviceId: { salonId: id, serviceId } },
    });
    return { ok: true };
  }

  async attachMedia(id: bigint, data: { mediaId?: string | bigint; mediaIds?: (string | bigint)[] }, kind: 'AVATAR' | 'COVER' | 'GALLERY', userId: bigint, isAdmin: boolean) {
    await this.checkOwnership(prisma, id, userId, isAdmin);

    if (kind === 'GALLERY' && data.mediaIds) {
      const results = [];
      for (const mId of data.mediaIds) {
        const mediaId = safeBigInt(mId, 'mediaId');
        const existingMedia = await prisma.media.findUnique({ where: { id: mediaId } });
        if (!existingMedia) throw new ApiError(404, `Media ${mId} not found`);

        if (!isAdmin && existingMedia.uploadedBy !== userId) {
          throw new ApiError(403, `You do not have permission to use media ${mId}`);
        }

        const updated = await prisma.media.update({
          where: { id: mediaId },
          data: {
            kind,
            entityType: EntityType.SALON,
            entityId: id,
          },
        });
        results.push(updated);
      }
      return results;
    }

    if (!data.mediaId) {
      throw new ApiError(400, 'mediaId is required');
    }

    const mediaId = safeBigInt(data.mediaId, 'mediaId');
    const existingMedia = await prisma.media.findUnique({ where: { id: mediaId } });
    if (!existingMedia) throw new ApiError(404, 'Media not found');

    if (!isAdmin && existingMedia.uploadedBy !== userId) {
      throw new ApiError(403, 'You do not have permission to use this media');
    }

    // Update media metadata to link it to this salon
    await prisma.media.update({
      where: { id: mediaId },
      data: {
        kind,
        entityType: EntityType.SALON,
        entityId: id,
      },
    });

    if (kind === 'AVATAR') {
      await prisma.salon.update({ where: { id }, data: { avatarMediaId: mediaId } });
    } else if (kind === 'COVER') {
      await prisma.salon.update({ where: { id }, data: { coverMediaId: mediaId } });
    }

    const finalMedia = await prisma.media.findUnique({ where: { id: mediaId } });
    return finalMedia;
  }

  async linkArtist(salonId: bigint, data: Record<string, unknown>, userId: bigint, isAdmin: boolean) {
    await this.checkOwnership(prisma, salonId, userId, isAdmin);
    const artistId = safeBigInt(data.artistId, 'artistId');

    const salonArtist = await prisma.salonArtist.upsert({
      where: {
        salonId_artistId: { salonId, artistId },
      },
      create: {
        salonId,
        artistId,
        roleTitle: data.roleTitle as string,
        isActive: (data.isActive as boolean) ?? true,
        startedAt: data.startedAt ? new Date(data.startedAt as string) : undefined,
      },
      update: {
        roleTitle: data.roleTitle as string,
        isActive: data.isActive as boolean,
        startedAt: data.startedAt ? new Date(data.startedAt as string) : undefined,
      },
    });
    return salonArtist;
  }

  async unlinkArtist(salonId: bigint, artistId: bigint, userId: bigint, isAdmin: boolean) {
    await this.checkOwnership(prisma, salonId, userId, isAdmin);

    await prisma.salonArtist.delete({
      where: { salonId_artistId: { salonId, artistId } },
    });
    return { ok: true };
  }
}
