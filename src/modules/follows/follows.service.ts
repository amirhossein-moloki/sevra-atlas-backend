import { prisma } from '../../shared/db/prisma';
import { FollowTargetType } from '@prisma/client';

export class FollowsService {
  async follow(userId: bigint, targetType: FollowTargetType, targetId: bigint) {
    return prisma.follow.upsert({
      where: {
        followerId_targetType_salonId_artistId: {
          followerId: userId,
          targetType,
          salonId: targetType === 'SALON' ? targetId : null,
          artistId: targetType === 'ARTIST' ? targetId : null,
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
          salonId: targetType === 'SALON' ? targetId : null,
          artistId: targetType === 'ARTIST' ? targetId : null,
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
    return this.serialize(follows);
  }

  private serialize(obj: any): any {
    if (!obj) return null;
    if (Array.isArray(obj)) return obj.map(o => this.serialize(o));
    const res = { ...obj };
    for (const key in res) {
      if (typeof res[key] === 'bigint') res[key] = res[key].toString();
      else if (typeof res[key] === 'object' && res[key] !== null && !(res[key] instanceof Date)) res[key] = this.serialize(res[key]);
    }
    return res;
  }
}
