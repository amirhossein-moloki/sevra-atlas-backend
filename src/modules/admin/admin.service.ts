import { prisma } from '../../shared/db/prisma';

export class AdminService {
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
      prisma.user.count({ where: { deletedAt: null } }),
      prisma.user.count({ where: { createdAt: { gte: thirtyDaysAgo }, deletedAt: null } }),
      prisma.user.count({ where: { createdAt: { gte: sixtyDaysAgo, lt: thirtyDaysAgo }, deletedAt: null } }),

      // Salons
      prisma.salon.count({ where: { deletedAt: null } }),
      prisma.salon.count({ where: { createdAt: { gte: thirtyDaysAgo }, deletedAt: null } }),
      prisma.salon.count({ where: { createdAt: { gte: sixtyDaysAgo, lt: thirtyDaysAgo }, deletedAt: null } }),

      // Artists
      prisma.artist.count({ where: { deletedAt: null } }),
      prisma.artist.count({ where: { createdAt: { gte: thirtyDaysAgo }, deletedAt: null } }),
      prisma.artist.count({ where: { createdAt: { gte: sixtyDaysAgo, lt: thirtyDaysAgo }, deletedAt: null } }),

      // Reviews
      prisma.review.count({ where: { deletedAt: null } }),
      prisma.review.count({ where: { createdAt: { gte: thirtyDaysAgo }, deletedAt: null } }),
      prisma.review.count({ where: { createdAt: { gte: sixtyDaysAgo, lt: thirtyDaysAgo }, deletedAt: null } }),

      // Current Pending
      prisma.report.count({ where: { status: 'OPEN' } }),
      prisma.verificationRequest.count({ where: { status: 'PENDING' } }),

      // Distributions
      prisma.salon.groupBy({ by: ['status'], _count: { id: true } }),
      prisma.review.groupBy({ by: ['rating'], _count: { id: true } }),
      prisma.salon.groupBy({
        by: ['cityId'],
        _count: { id: true },
        orderBy: { _count: { id: 'desc' } },
        take: 5,
      }),
      prisma.post.groupBy({ by: ['status'], _count: { id: true } }),
    ]);

    // Resolve city names for topCities
    const topCitiesWithNames = await Promise.all(
      topCities.map(async (c) => {
        if (!c.cityId) return { name: 'Unknown', count: c._count.id };
        const city = await prisma.city.findUnique({ where: { id: c.cityId } });
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
        salonStatus: salonStatusDist.map(d => ({ status: d.status, count: d._count.id })),
        reviewRating: reviewRatingDist.map(d => ({ rating: d.rating, count: d._count.id })),
        postStatus: postStatusDist.map(d => ({ status: d.status, count: d._count.id })),
      },
      topCities: topCitiesWithNames,
    };
  }

  async getStats(from: string, to: string) {
    const fromDate = new Date(from);
    const toDate = new Date(to);

    const [newUsers, newSalons, newArtists, newReviews, newPosts] = await Promise.all([
      this.getDailyStats('users_user', 'createdAt', fromDate, toDate, 'deletedAt'),
      this.getDailyStats('Salon', 'createdAt', fromDate, toDate, 'deletedAt'),
      this.getDailyStats('Artist', 'createdAt', fromDate, toDate, 'deletedAt'),
      this.getDailyStats('Review', 'createdAt', fromDate, toDate, 'deletedAt'),
      this.getDailyStats('blog_post', 'published_at', fromDate, toDate),
    ]);

    return {
      series: {
        newUsers,
        newSalons,
        newArtists,
        newReviews,
        newPosts,
      }
    };
  }

  private async getDailyStats(table: string, column: string, from: Date, to: Date, deletedColumn?: string) {
    // Whitelist for dynamic table and column names to prevent SQL injection
    const allowedTables = ['users_user', 'Salon', 'Artist', 'Review', 'blog_post'];
    const allowedColumns = ['createdAt', 'published_at', 'deletedAt'];

    if (!allowedTables.includes(table)) {
      throw new Error(`Unauthorized table access: ${table}`);
    }
    if (!allowedColumns.includes(column)) {
      throw new Error(`Unauthorized column access: ${column}`);
    }
    if (deletedColumn && !allowedColumns.includes(deletedColumn)) {
      throw new Error(`Unauthorized deleted column access: ${deletedColumn}`);
    }

    const deletedFilter = deletedColumn ? `AND "${deletedColumn}" IS NULL` : '';
    const data = await prisma.$queryRawUnsafe<any[]>(`
      SELECT DATE_TRUNC('day', "${column}") as date, COUNT(*)::int as count
      FROM "${table}"
      WHERE "${column}" >= $1 AND "${column}" <= $2 ${deletedFilter}
      GROUP BY date
      ORDER BY date ASC
    `, from, to);

    return data.map(d => ({
      date: d.date instanceof Date ? d.date.toISOString().split('T')[0] : d.date,
      count: Number(d.count)
    }));
  }
}
