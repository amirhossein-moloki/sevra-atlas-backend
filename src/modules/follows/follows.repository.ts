import { prisma } from '../../shared/db/prisma';
import { TransactionClient } from '../../shared/db/tx';
import { FollowTargetType, Prisma } from '@prisma/client';

export class FollowsRepository {
  private db(tx?: TransactionClient) {
    return tx || prisma;
  }

  async upsert(userId: bigint, targetType: FollowTargetType, targetId: bigint, tx?: TransactionClient) {
    const salonId = targetType === 'SALON' ? targetId : null;
    const artistId = targetType === 'ARTIST' ? targetId : null;

    return this.db(tx).follow.upsert({
      where: {
        followerId_targetType_salonId_artistId: {
          followerId: userId,
          targetType,
          salonId: salonId as any,
          artistId: artistId as any,
        },
      },
      create: {
        followerId: userId,
        targetType,
        salonId,
        artistId,
      },
      update: {},
    });
  }

  async delete(userId: bigint, targetType: FollowTargetType, targetId: bigint, tx?: TransactionClient) {
    const salonId = targetType === 'SALON' ? targetId : null;
    const artistId = targetType === 'ARTIST' ? targetId : null;

    return this.db(tx).follow.delete({
      where: {
        followerId_targetType_salonId_artistId: {
          followerId: userId,
          targetType,
          salonId: salonId as any,
          artistId: artistId as any,
        },
      },
    });
  }

  async findMany(params: Prisma.FollowFindManyArgs, tx?: TransactionClient) {
    return this.db(tx).follow.findMany(params);
  }
}

export const followsRepository = new FollowsRepository();
