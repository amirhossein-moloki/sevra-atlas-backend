import { PlanTier, SubscriptionStatus } from '@prisma/client';

export interface RankingFactors {
  avgRating: number;
  reviewCount: number;
  planTier: PlanTier;
  subscriptionStatus: SubscriptionStatus | null;
  featuredUntil: Date | null;
}

export function calculateVisibilityScore(factors: RankingFactors): number {
  const { avgRating, reviewCount, planTier, subscriptionStatus, featuredUntil } = factors;

  // 1. Base Quality Score (0-100)
  // Rating is weighted heavily (0-50 points)
  const ratingScore = avgRating * 10;
  // Review count gives diminishing returns (0-50 points, reaches 50 at ~500 reviews)
  const reviewScore = Math.min(50, Math.log2(reviewCount + 1) * 5.5);

  const baseScore = ratingScore + reviewScore;

  // 2. Visibility Boost based on Plan
  let visibilityBoost = 0;
  const isActive = subscriptionStatus === SubscriptionStatus.ACTIVE;

  if (isActive) {
    switch (planTier) {
      case PlanTier.PRO:
        visibilityBoost = 25; // Significant boost
        break;
      case PlanTier.VIP:
        visibilityBoost = 60; // Huge boost, usually puts them at the top
        break;
      default:
        visibilityBoost = 0;
    }
  }

  // 3. Featured Multiplier/Bonus
  let featuredBonus = 0;
  const isFeatured = featuredUntil && featuredUntil > new Date();
  if (isFeatured) {
    featuredBonus = 40; // Additional boost for being featured
  }

  return baseScore + visibilityBoost + featuredBonus;
}
