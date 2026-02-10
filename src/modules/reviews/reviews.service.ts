import { prisma } from '../../shared/db/prisma';
import { ApiError } from '../../shared/errors/ApiError';
import { ReviewStatus } from '@prisma/client';

export class ReviewsService {
  async createReview(data: any, authorId: bigint) {
    const { targetType, targetId, rating, title, body } = data;
    const id = BigInt(targetId);

    // Business rule: one review per user per target
    const existing = await prisma.review.findFirst({
      where: {
        authorId,
        ...(targetType === 'SALON' ? { salonId: id } : { artistId: id }),
      },
    });

    if (existing) {
      throw new ApiError(400, 'You have already reviewed this entity');
    }

    const review = await prisma.review.create({
      data: {
        authorId,
        rating,
        title,
        body,
        status: ReviewStatus.PUBLISHED,
        ...(targetType === 'SALON' ? { salonId: id } : { artistId: id }),
      },
    });

    // Update avg rating (simple version)
    // In production, use a more robust way or async task
    return review;
  }

  async voteReview(reviewId: bigint, userId: bigint, isLike: boolean) {
    return prisma.reviewVote.upsert({
      where: {
        userId_reviewId: { userId, reviewId },
      },
      update: { isLike },
      create: { userId, reviewId, isLike },
    });
  }
}
