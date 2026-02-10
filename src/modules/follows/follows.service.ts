import { prisma } from '../../shared/db/prisma';
import { FollowTargetType } from '@prisma/client';
import { serialize } from '../../shared/utils/serialize';

export class FollowsService {
  async follow(userId: bigint, targetType: FollowTargetType, targetId: bigint) {
    return prisma.follow.upsert({
      where: {
        followerId_targetType_salonId_artistId: {
          followerId: userId,
          targetType,
          salonId: (targetType === 'SALON' ? targetId : null) as any,
          artistId: (targetType === 'ARTIST' ? targetId : null) as any,
        },
      },
      create: {
        followerId: userId,
        targetType,
        salonId: targetType === 'SALON' ? targetId : null,
        artistId: targetType === 'ARTIST' ? targetId : null,
      },
      update: {},
    });
  }

  async unfollow(userId: bigint, targetType: FollowTargetType, targetId: bigint) {
    await prisma.follow.delete({
      where: {
        followerId_targetType_salonId_artistId: {
          followerId: userId,
          targetType,
          salonId: (targetType === 'SALON' ? targetId : null) as any,
          artistId: (targetType === 'ARTIST' ? targetId : null) as any,
        },
      },
    });
    return { ok: true };
  }

  async getMyFollows(userId: bigint) {
    const follows = await prisma.follow.findMany({
      where: { followerId: userId },
      include: {
        salon: { select: { id: true, name: true, slug: true } },
        artist: { select: { id: true, fullName: true, slug: true } },
      },
    });
    return serialize(follows);
  }
}
