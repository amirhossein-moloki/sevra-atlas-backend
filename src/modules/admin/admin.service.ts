import { adminRepository, AdminRepository } from './admin.repository';

export class AdminService {
  constructor(
    private readonly repo: AdminRepository = adminRepository
  ) {}

  async getDashboardSummary() {
    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const sixtyDaysAgo = new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000);

    const [
      totalUsers, usersLast30, usersPrev30,
      totalSalons, salonsLast30, salonsPrev30,
      totalArtists, artistsLast30, artistsPrev30,
      totalReviews, reviewsLast30, reviewsPrev30,
      reportsOpen,
      verificationPending,
      salonStatusDist,
      reviewRatingDist,
      topCities,
      postStatusDist
    ] = await Promise.all([
      // Users
      this.repo.countUsers({ deletedAt: null }),
      this.repo.countUsers({ createdAt: { gte: thirtyDaysAgo }, deletedAt: null }),
      this.repo.countUsers({ createdAt: { gte: sixtyDaysAgo, lt: thirtyDaysAgo }, deletedAt: null }),

      // Salons
      this.repo.countSalons({ deletedAt: null }),
      this.repo.countSalons({ createdAt: { gte: thirtyDaysAgo }, deletedAt: null }),
      this.repo.countSalons({ createdAt: { gte: sixtyDaysAgo, lt: thirtyDaysAgo }, deletedAt: null }),

      // Artists
      this.repo.countArtists({ deletedAt: null }),
      this.repo.countArtists({ createdAt: { gte: thirtyDaysAgo }, deletedAt: null }),
      this.repo.countArtists({ createdAt: { gte: sixtyDaysAgo, lt: thirtyDaysAgo }, deletedAt: null }),

      // Reviews
      this.repo.countReviews({ deletedAt: null }),
      this.repo.countReviews({ createdAt: { gte: thirtyDaysAgo }, deletedAt: null }),
      this.repo.countReviews({ createdAt: { gte: sixtyDaysAgo, lt: thirtyDaysAgo }, deletedAt: null }),

      // Current Pending
      this.repo.countReports({ status: 'OPEN' }),
      this.repo.countVerificationRequests({ status: 'PENDING' }),

      // Distributions
      this.repo.groupBySalons({ by: ['status'], _count: { id: true } }),
      this.repo.groupByReviews({ by: ['rating'], _count: { id: true } }),
      this.repo.groupBySalons({
        by: ['cityId'],
        _count: { id: true },
        orderBy: { _count: { id: 'desc' } },
        take: 5,
      }),
      this.repo.groupByPosts({ by: ['status'], _count: { id: true } }),
    ]);

    // Resolve city names for topCities
    const topCitiesWithNames = await Promise.all(
      (topCities as any[]).map(async (c) => {
        if (!c.cityId) return { name: 'Unknown', count: c._count.id };
        const city = await this.repo.findCityUnique(c.cityId);
        return { name: city?.nameFa || 'Unknown', count: c._count.id };
      })
    );

    const calculateGrowth = (current: number, previous: number) => {
      if (previous === 0) return current > 0 ? 100 : 0;
      return Math.round(((current - previous) / previous) * 100);
    };

    return {
      counts: {
        users: { total: totalUsers, growth: calculateGrowth(usersLast30, usersPrev30) },
        salons: { total: totalSalons, growth: calculateGrowth(salonsLast30, salonsPrev30) },
        artists: { total: totalArtists, growth: calculateGrowth(artistsLast30, artistsPrev30) },
        reviews: { total: totalReviews, growth: calculateGrowth(reviewsLast30, reviewsPrev30) },
        reportsOpen,
        verificationPending,
      },
      distributions: {
        salonStatus: (salonStatusDist as any[]).map(d => ({ status: d.status, count: d._count.id })),
        reviewRating: (reviewRatingDist as any[]).map(d => ({ rating: d.rating, count: d._count.id })),
        postStatus: (postStatusDist as any[]).map(d => ({ status: d.status, count: d._count.id })),
      },
      topCities: topCitiesWithNames,
    };
  }

  async getStats(from: string, to: string) {
    const fromDate = new Date(from);
    const toDate = new Date(to);

    const [newUsers, newSalons, newArtists, newReviews, newPosts] = await Promise.all([
      this.repo.getDailyStats('users_user', 'createdAt', fromDate, toDate, 'deletedAt'),
      this.repo.getDailyStats('Salon', 'createdAt', fromDate, toDate, 'deletedAt'),
      this.repo.getDailyStats('Artist', 'createdAt', fromDate, toDate, 'deletedAt'),
      this.repo.getDailyStats('Review', 'createdAt', fromDate, toDate, 'deletedAt'),
      this.repo.getDailyStats('blog_post', 'published_at', fromDate, toDate),
    ]);

    const formatData = (data: any[]) => data.map(d => ({
      date: d.date instanceof Date ? d.date.toISOString().split('T')[0] : d.date,
      count: Number(d.count)
    }));

    return {
      series: {
        newUsers: formatData(newUsers),
        newSalons: formatData(newSalons),
        newArtists: formatData(newArtists),
        newReviews: formatData(newReviews),
        newPosts: formatData(newPosts),
      }
    };
  }
}
