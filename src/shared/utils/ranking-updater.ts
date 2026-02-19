import { prisma } from '../db/prisma';
import { calculateVisibilityScore } from './ranking';
import { PlanTier } from '@prisma/client';

export async function updateEntityVisibilityScore(targetType: 'SALON' | 'ARTIST', targetId: bigint) {
  if (targetType === 'SALON') {
    const salon = await prisma.salon.findUnique({
      where: { id: targetId },
      include: { plan: true }
    });

    if (!salon) return;

    const score = calculateVisibilityScore({
      avgRating: salon.avgRating,
      reviewCount: salon.reviewCount,
      planTier: salon.plan?.tier || PlanTier.FREE,
      subscriptionStatus: salon.subscriptionStatus,
      featuredUntil: salon.featuredUntil,
    });

    await prisma.salon.update({
      where: { id: targetId },
      data: { visibilityScore: score }
    });
  } else {
    const artist = await prisma.artist.findUnique({
      where: { id: targetId },
      include: { plan: true }
    });

    if (!artist) return;

    const score = calculateVisibilityScore({
      avgRating: artist.avgRating,
      reviewCount: artist.reviewCount,
      planTier: artist.plan?.tier || PlanTier.FREE,
      subscriptionStatus: artist.subscriptionStatus,
      featuredUntil: artist.featuredUntil,
    });

    await prisma.artist.update({
      where: { id: targetId },
      data: { visibilityScore: score }
    });
  }
}
