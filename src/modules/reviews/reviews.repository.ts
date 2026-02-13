import { prisma } from '../../shared/db/prisma';
import { TransactionClient } from '../../shared/db/tx';
import { Prisma, ReviewStatus } from '@prisma/client';

export class ReviewsRepository {
  private db(tx?: TransactionClient) {
    return tx || prisma;
  }

  async findMany(params: Prisma.ReviewFindManyArgs, tx?: TransactionClient) {
    const [data, total] = await Promise.all([
      this.db(tx).review.findMany(params),
      this.db(tx).review.count({ where: params.where }),
    ]);
    return { data, total };
  }

  async findFirst(where: Prisma.ReviewWhereInput, tx?: TransactionClient) {
    return this.db(tx).review.findFirst({ where });
  }

  async findUnique(id: bigint, tx?: TransactionClient) {
    return this.db(tx).review.findUnique({ where: { id } });
  }

  async create(data: Prisma.ReviewUncheckedCreateInput, tx?: TransactionClient) {
    return this.db(tx).review.create({ data });
  }

  async update(id: bigint, data: Prisma.ReviewUncheckedUpdateInput, tx?: TransactionClient) {
    return this.db(tx).review.update({ where: { id }, data });
  }

  async softDelete(id: bigint, tx?: TransactionClient) {
    return this.db(tx).review.update({
      where: { id },
      data: { status: ReviewStatus.REMOVED, deletedAt: new Date() },
    });
  }

  async upsertVote(userId: bigint, reviewId: bigint, isLike: boolean, tx?: TransactionClient) {
    return this.db(tx).reviewVote.upsert({
      where: {
        userId_reviewId: { userId, reviewId },
      },
      update: { isLike },
      create: { userId, reviewId, isLike },
    });
  }

  async countVotes(where: Prisma.ReviewVoteWhereInput, tx?: TransactionClient) {
    return this.db(tx).reviewVote.count({ where });
  }

  async aggregateReviews(args: Prisma.ReviewAggregateArgs, tx?: TransactionClient) {
    return this.db(tx).review.aggregate(args);
  }

  async updateSalonAggregates(id: bigint, data: { avgRating: number; reviewCount: number }, tx?: TransactionClient) {
    return this.db(tx).salon.update({
      where: { id },
      data,
      select: { slug: true, cityId: true }
    });
  }

  async updateArtistAggregates(id: bigint, data: { avgRating: number; reviewCount: number }, tx?: TransactionClient) {
    return this.db(tx).artist.update({
      where: { id },
      data,
      select: { slug: true, cityId: true }
    });
  }
}

export const reviewsRepository = new ReviewsRepository();
