import { prisma } from '../../shared/db/prisma';
import { ApiError } from '../../shared/errors/ApiError';
import crypto from 'crypto';

export class GrowthService {
  async createInvite(inviterId: bigint, maxUses: number = 1, expiresDays: number = 7) {
    const code = crypto.randomBytes(6).toString('hex').toUpperCase();
    const expiresAt = new Date(Date.now() + expiresDays * 24 * 60 * 60 * 1000);

    return prisma.invite.create({
      data: {
        inviterId,
        code,
        maxUses,
        expiresAt,
      },
    });
  }

  async trackReferral(inviteeId: bigint, inviteCode: string) {
    return prisma.$transaction(async (tx) => {
      const invite = await tx.invite.findUnique({
        where: { code: inviteCode },
      });

      if (!invite) {
        // Fallback to checking if it's a user's personal referral code
        const inviter = await tx.user.findUnique({
          where: { referralCode: inviteCode },
        });

        if (inviter) {
          await tx.user.update({
            where: { id: inviteeId },
            data: { invitedById: inviter.id },
          });
          return { success: true, type: 'personal' };
        }

        throw new ApiError(404, 'Invalid invite or referral code');
      }

      if (invite.expiresAt && invite.expiresAt < new Date()) {
        throw new ApiError(400, 'Invite code expired');
      }

      if (invite.usedCount >= invite.maxUses) {
        throw new ApiError(400, 'Invite code already fully used');
      }

      await tx.invite.update({
        where: { id: invite.id },
        data: { usedCount: { increment: 1 } },
      });

      await tx.user.update({
        where: { id: inviteeId },
        data: { invitedById: invite.inviterId },
      });

      return { success: true, type: 'campaign' };
    });
  }

  async getInviterStats(userId: bigint) {
    const referrals = await prisma.user.findMany({
      where: { invitedById: userId },
      include: {
        salons: { select: { id: true, name: true, status: true } },
        artists: { select: { id: true, fullName: true, status: true } },
      }
    });

    return {
      count: referrals.length,
      referrals: referrals.map(r => ({
        id: r.id.toString(),
        name: `${r.firstName} ${r.lastName}`,
        salons: r.salons,
        artists: r.artists,
      })),
    };
  }
}
