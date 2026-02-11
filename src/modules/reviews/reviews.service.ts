import { prisma } from '../../shared/db/prisma';
import { ApiError } from '../../shared/errors/ApiError';
import { ReviewStatus } from '@prisma/client';
import { serialize } from '../../shared/utils/serialize';

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

    await this.recomputeAggregates(targetType, id);

    return serialize(review);
  }

  async getReviews(targetType: 'SALON' | 'ARTIST', slug: string, query: any) {
    const { page = 1, pageSize = 20, status } = query;
    const limit = parseInt(pageSize as string) || 20;
    const skip = (parseInt(page as string || '1') - 1) * limit;

    const where: any = {
      status: status || ReviewStatus.PUBLISHED,
      deletedAt: null,
      ...(targetType === 'SALON' ? { salon: { slug } } : { artist: { slug } }),
    };

    const [data, total] = await Promise.all([
      prisma.review.findMany({
        where,
        include: { author: { select: { id: true, firstName: true, lastName: true, profilePicture: true } } },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.review.count({ where }),
    ]);

    return {
      data: data.map(r => serialize(r)),
      meta: { page: parseInt(page as string || '1'), pageSize: limit, total, totalPages: Math.ceil(total / limit) },
    };
  }

  async deleteReview(reviewId: bigint, userId: bigint, isAdmin: boolean) {
    const review = await prisma.review.findUnique({ where: { id: reviewId } });
    if (!review) throw new ApiError(404, 'Review not found');

    if (!isAdmin && review.authorId !== userId) {
      throw new ApiError(403, 'Forbidden');
    }

    await prisma.review.update({
      where: { id: reviewId },
      data: { status: ReviewStatus.REMOVED, deletedAt: new Date() },
    });

    if (review.salonId) await this.recomputeAggregates('SALON', review.salonId);
    if (review.artistId) await this.recomputeAggregates('ARTIST', review.artistId);

    return { ok: true };
  }

  async voteReview(reviewId: bigint, userId: bigint, isLike: boolean) {
    await prisma.reviewVote.upsert({
      where: {
        userId_reviewId: { userId, reviewId },
      },
      update: { isLike },
      create: { userId, reviewId, isLike },
    });

    // Update counts on review
    const [likes, dislikes] = await Promise.all([
      prisma.reviewVote.count({ where: { reviewId, isLike: true } }),
      prisma.reviewVote.count({ where: { reviewId, isLike: false } }),
    ]);

    await prisma.review.update({
      where: { id: reviewId },
      data: { likeCount: likes, dislikeCount: dislikes },
    });

    return { ok: true, likeCount: likes, dislikeCount: dislikes };
  }

  private async recomputeAggregates(targetType: 'SALON' | 'ARTIST', targetId: bigint) {
    const where = {
      status: ReviewStatus.PUBLISHED,
      deletedAt: null,
      ...(targetType === 'SALON' ? { salonId: targetId } : { artistId: targetId }),
    };

    const aggregations = await prisma.review.aggregate({
      where,
      _avg: { rating: true },
      _count: { id: true },
    });

    const avgRating = aggregations._avg.rating || 0;
    const reviewCount = aggregations._count.id || 0;

    if (targetType === 'SALON') {
      await prisma.salon.update({
        where: { id: targetId },
        data: { avgRating, reviewCount },
      });
    } else {
      await prisma.artist.update({
        where: { id: targetId },
        data: { avgRating, reviewCount },
      });
    }
  }

}
