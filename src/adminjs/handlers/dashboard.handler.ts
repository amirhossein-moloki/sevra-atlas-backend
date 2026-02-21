import { PrismaClient } from '@prisma/client';

export const getDashboardData = async (prisma: PrismaClient) => {
  const [
    userCount,
    salonCount,
    artistCount,
    recentPayments,
    totalRevenue,
    pendingVerifications,
  ] = await Promise.all([
    prisma.user.count(),
    prisma.salon.count(),
    prisma.artist.count(),
    prisma.payment.findMany({
      take: 5,
      orderBy: { createdAt: 'desc' },
      include: { user: true },
    }),
    prisma.payment.aggregate({
      where: { status: 'VERIFIED' },
      _sum: { amount: true },
    }),
    prisma.verificationRequest.count({
      where: { status: 'PENDING' },
    }),
  ]);

  return {
    metrics: {
      users: userCount,
      salons: salonCount,
      artists: artistCount,
      revenue: Number(totalRevenue._sum.amount || 0),
      pendingVerifications,
    },
    recentPayments: recentPayments.map(p => ({
      id: p.id.toString(),
      user: p.user.email,
      amount: Number(p.amount),
      status: p.status,
      createdAt: p.createdAt,
    })),
  };
};
