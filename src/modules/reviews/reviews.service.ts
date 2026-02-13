import { ApiError } from '../../shared/errors/ApiError';
import { ReviewStatus, Prisma } from '@prisma/client';
import { CacheService } from '../../shared/redis/cache.service';
import { CacheKeys } from '../../shared/redis/cache-keys';
import { reviewsRepository, ReviewsRepository } from './reviews.repository';

export class ReviewsService {
  constructor(
    private readonly repo: ReviewsRepository = reviewsRepository
  ) {}

  async createReview(data: any, authorId: bigint) {
    const { targetType, targetId, rating, title, body } = data;
    const id = BigInt(targetId);

    // Business rule: one review per user per target
    const existing = await this.repo.findFirst({
      authorId,
      ...(targetType === 'SALON' ? { salonId: id } : { artistId: id }),
    });

    if (existing) {
      throw new ApiError(400, 'You have already reviewed this entity');
    }

    const review = await this.repo.create({
      authorId,
      rating,
      title,
      body,
      status: ReviewStatus.PUBLISHED,
      ...(targetType === 'SALON' ? { salonId: id } : { artistId: id }),
    });

    await this.recomputeAggregates(targetType, id);

    return review;
  }

  async getReviews(targetType: 'SALON' | 'ARTIST', slug: string, query: any) {
    const { page = 1, pageSize = 20, status } = query;
    const limit = parseInt(pageSize as string) || 20;
    const skip = (parseInt(page as string || '1') - 1) * limit;

    const where: Prisma.ReviewWhereInput = {
      status: (status as ReviewStatus) || ReviewStatus.PUBLISHED,
      deletedAt: null,
      ...(targetType === 'SALON' ? { salon: { slug } } : { artist: { slug } }),
    };

    const { data, total } = await this.repo.findMany({
      where,
      include: { author: { select: { id: true, firstName: true, lastName: true, profilePicture: true } } },
      orderBy: { createdAt: 'desc' },
      skip,
      take: limit,
    });

    return {
      data: data,
      meta: { page: parseInt(page as string || '1'), pageSize: limit, total, totalPages: Math.ceil(total / limit) },
    };
  }

  async deleteReview(reviewId: bigint, userId: bigint, isAdmin: boolean) {
    const review = await this.repo.findUnique(reviewId);
    if (!review) throw new ApiError(404, 'Review not found');

    if (!isAdmin && review.authorId !== userId) {
      throw new ApiError(403, 'Forbidden');
    }

    await this.repo.softDelete(reviewId);

    if (review.salonId) await this.recomputeAggregates('SALON', review.salonId);
    if (review.artistId) await this.recomputeAggregates('ARTIST', review.artistId);

    return { ok: true };
  }

  async voteReview(reviewId: bigint, userId: bigint, isLike: boolean) {
    await this.repo.upsertVote(userId, reviewId, isLike);

    // Update counts on review
    const [likes, dislikes] = await Promise.all([
      this.repo.countVotes({ reviewId, isLike: true }),
      this.repo.countVotes({ reviewId, isLike: false }),
    ]);

    await this.repo.update(reviewId, { likeCount: likes, dislikeCount: dislikes });

    return { ok: true, likeCount: likes, dislikeCount: dislikes };
  }

  private async recomputeAggregates(targetType: 'SALON' | 'ARTIST', targetId: bigint) {
    const where = {
      status: ReviewStatus.PUBLISHED,
      deletedAt: null,
      ...(targetType === 'SALON' ? { salonId: targetId } : { artistId: targetId }),
    };

    const aggregations = await this.repo.aggregateReviews({
      where,
      _avg: { rating: true },
      _count: { id: true },
    });

    const avgRating = (aggregations as any)._avg?.rating || 0;
    const reviewCount = (aggregations as any)._count?.id || 0;

    if (targetType === 'SALON') {
      const salon = await this.repo.updateSalonAggregates(targetId, { avgRating, reviewCount });
      await CacheService.del(CacheKeys.SALON_DETAIL(salon.slug));
      await CacheService.delByPattern(CacheKeys.SALONS_LIST_PATTERN);
      if (salon.cityId) await CacheService.del(CacheKeys.CITY_STATS(salon.cityId));
    } else {
      const artist = await this.repo.updateArtistAggregates(targetId, { avgRating, reviewCount });
      await CacheService.del(CacheKeys.ARTIST_DETAIL(artist.slug));
      await CacheService.delByPattern(CacheKeys.ARTISTS_LIST_PATTERN);
      if (artist.cityId) await CacheService.del(CacheKeys.CITY_STATS(artist.cityId));
    }
  }

}
