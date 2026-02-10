import { prisma } from '../../shared/db/prisma';

export class AdminService {
  async getDashboardSummary() {
    const [users, salons, artists, reviews, reports, verifications] = await Promise.all([
      prisma.user.count(),
      prisma.salon.count(),
      prisma.artist.count(),
      prisma.review.count(),
      prisma.report.count({ where: { status: 'OPEN' } }),
      prisma.verificationRequest.count({ where: { status: 'PENDING' } }),
    ]);

    return {
      counts: {
        users,
        salons,
        artists,
        reviews,
        reportsOpen: reports,
        verificationPending: verifications,
      }
    };
  }

  async getStats(from: string, to: string) {
    // Simplified time-series stats
    const fromDate = new Date(from);
    const toDate = new Date(to);

    const users = await prisma.user.groupBy({
      by: ['createdAt'],
      where: { createdAt: { gte: fromDate, lte: toDate } },
      _count: true,
    });

    return {
      series: {
        newUsers: users.map(u => ({ date: u.createdAt.toISOString().split('T')[0], count: u._count })),
      }
    };
  }
}
