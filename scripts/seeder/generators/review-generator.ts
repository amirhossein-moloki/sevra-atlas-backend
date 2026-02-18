import { PrismaClient, ReviewStatus } from '@prisma/client';
import { BaseGenerator, getRandom, weightedRandom } from './base';

export class ReviewGenerator extends BaseGenerator {
  async seed(count: number): Promise<void> {
    this.log(`Seeding reviews with realistic distribution...`);

    const users = await this.prisma.user.findMany({ where: { role: 'USER' } });
    const salons = await this.prisma.salon.findMany();

    if (users.length === 0 || salons.length === 0) return;

    // Power-law distribution logic
    // We want to distribute 'count' reviews among salons such that a few salons get many reviews.
    for (let i = 0; i < count; i++) {
      // Pick a salon based on a skewed index
      // Using a simplified power-law: index = floor(N * (1 - sqrt(random)))
      const salonIndex = Math.floor(salons.length * (1 - Math.sqrt(Math.random())));
      const salon = salons[salonIndex];
      const user = getRandom(users);

      // Weighted ratings (mostly 4 and 5 stars)
      const ratings = [1, 2, 3, 4, 5];
      const ratingWeights = [0.05, 0.05, 0.1, 0.3, 0.5];
      const rating = ratings[weightedRandom(ratingWeights)];

      await this.prisma.review.create({
        data: {
          authorId: user.id,
          salonId: salon.id,
          rating,
          title: rating >= 4 ? 'عالی بود' : 'معمولی',
          body: rating >= 4 ? 'از خدمات بسیار راضی بودم و حتما دوباره مراجعه می‌کنم.' : 'بد نبود ولی جای کار داشت.',
          status: ReviewStatus.PUBLISHED,
          createdAt: new Date(Date.now() - Math.random() * 60 * 24 * 60 * 60 * 1000),
        }
      });
    }

    // After seeding reviews, update salon stats
    this.log('Updating Salon review stats...');
    for (const salon of salons) {
      const aggregate = await this.prisma.review.aggregate({
        where: { salonId: salon.id },
        _avg: { rating: true },
        _count: { id: true },
      });

      await this.prisma.salon.update({
        where: { id: salon.id },
        data: {
          avgRating: aggregate._avg.rating || 0,
          reviewCount: aggregate._count.id,
        }
      });
    }
  }
}
