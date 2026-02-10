import { prisma } from '../../shared/db/prisma';
import { SaveTargetType } from '@prisma/client';

export class SavesService {
  async save(userId: bigint, targetType: SaveTargetType, targetId: bigint) {
    return prisma.save.upsert({
      where: {
        userId_targetType_salonId_artistId_postId: {
          userId,
          targetType,
          salonId: targetType === 'SALON' ? targetId : null,
          artistId: targetType === 'ARTIST' ? targetId : null,
          postId: targetType === 'BLOG_POST' ? targetId : null,
        },
      },
      create: {
        userId,
        targetType,
        salonId: targetType === 'SALON' ? targetId : null,
        artistId: targetType === 'ARTIST' ? targetId : null,
        postId: targetType === 'BLOG_POST' ? targetId : null,
      },
      update: {},
    });
  }

  async unsave(userId: bigint, targetType: SaveTargetType, targetId: bigint) {
    await prisma.save.delete({
      where: {
        userId_targetType_salonId_artistId_postId: {
          userId,
          targetType,
          salonId: targetType === 'SALON' ? targetId : null,
          artistId: targetType === 'ARTIST' ? targetId : null,
          postId: targetType === 'BLOG_POST' ? targetId : null,
        },
      },
    });
    return { ok: true };
  }

  async getMySaves(userId: bigint) {
    const saves = await prisma.save.findMany({
      where: { userId },
      include: {
        salon: { select: { id: true, name: true, slug: true } },
        artist: { select: { id: true, fullName: true, slug: true } },
        post: { select: { id: true, title: true, slug: true } },
      },
    });
    return this.serialize(saves);
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
