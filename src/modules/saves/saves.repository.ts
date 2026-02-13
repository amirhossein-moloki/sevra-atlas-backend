import { prisma } from '../../shared/db/prisma';
import { TransactionClient } from '../../shared/db/tx';
import { SaveTargetType, Prisma } from '@prisma/client';

export class SavesRepository {
  private db(tx?: TransactionClient) {
    return tx || prisma;
  }

  async upsert(userId: bigint, targetType: SaveTargetType, targetId: bigint, tx?: TransactionClient) {
    const salonId = targetType === 'SALON' ? targetId : null;
    const artistId = targetType === 'ARTIST' ? targetId : null;
    const postId = targetType === 'BLOG_POST' ? targetId : null;

    return this.db(tx).save.upsert({
      where: {
        userId_targetType_salonId_artistId_postId: {
          userId,
          targetType,
          salonId: salonId as any,
          artistId: artistId as any,
          postId: postId as any,
        },
      },
      create: {
        userId,
        targetType,
        salonId,
        artistId,
        postId,
      },
      update: {},
    });
  }

  async delete(userId: bigint, targetType: SaveTargetType, targetId: bigint, tx?: TransactionClient) {
    const salonId = targetType === 'SALON' ? targetId : null;
    const artistId = targetType === 'ARTIST' ? targetId : null;
    const postId = targetType === 'BLOG_POST' ? targetId : null;

    return this.db(tx).save.delete({
      where: {
        userId_targetType_salonId_artistId_postId: {
          userId,
          targetType,
          salonId: salonId as any,
          artistId: artistId as any,
          postId: postId as any,
        },
      },
    });
  }

  async findMany(params: Prisma.SaveFindManyArgs, tx?: TransactionClient) {
    return this.db(tx).save.findMany(params);
  }
}

export const savesRepository = new SavesRepository();
