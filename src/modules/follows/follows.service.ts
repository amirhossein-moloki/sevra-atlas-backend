import { prisma } from '../../shared/db/prisma';
import { FollowTargetType } from '@prisma/client';

export class FollowsService {
  async follow(userId: bigint, targetType: FollowTargetType, targetId: bigint) {
    return prisma.follow.upsert({
      where: {
        followerId_targetType_salonId_artistId: {
          followerId: userId,
          targetType,
          // Use unknown cast for null values to satisfy Prisma's strict compound unique key types
          // while maintaining runtime correctness (PostgreSQL allows NULL in unique constraints)
          salonId: targetType === 'SALON' ? targetId : (null as unknown as bigint),
          artistId: targetType === 'ARTIST' ? targetId : (null as unknown as bigint),
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
          salonId: targetType === 'SALON' ? targetId : (null as unknown as bigint),
          artistId: targetType === 'ARTIST' ? targetId : (null as unknown as bigint),
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
    return follows;
  }
}
