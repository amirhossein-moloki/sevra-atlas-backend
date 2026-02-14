import { prisma } from '../../shared/db/prisma';
import { SaveTargetType } from '@prisma/client';

export class SavesService {
  async save(userId: bigint, targetType: SaveTargetType, targetId: bigint) {
    return prisma.save.upsert({
      where: {
        userId_targetType_salonId_artistId_postId: {
          userId,
          targetType,
          // Use unknown cast for null values to satisfy Prisma's strict compound unique key types
          // while maintaining runtime correctness (PostgreSQL allows NULL in unique constraints)
          salonId: targetType === 'SALON' ? BigInt(targetId) : (null as unknown as bigint),
          artistId: targetType === 'ARTIST' ? BigInt(targetId) : (null as unknown as bigint),
          postId: targetType === 'BLOG_POST' ? BigInt(targetId) : (null as unknown as bigint),
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
          salonId: targetType === 'SALON' ? BigInt(targetId) : (null as unknown as bigint),
          artistId: targetType === 'ARTIST' ? BigInt(targetId) : (null as unknown as bigint),
          postId: targetType === 'BLOG_POST' ? BigInt(targetId) : (null as unknown as bigint),
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
    return saves;
  }
}
