import { mockDeep, mockReset } from 'jest-mock-extended';

const prismaMock = mockDeep<any>();

jest.mock('../src/shared/db/prisma', () => ({
  __esModule: true,
  prisma: prismaMock,
}));

import { AdminService } from '../src/modules/admin/admin.service';

describe('AdminService', () => {
  let adminService: AdminService;

  beforeEach(() => {
    adminService = new AdminService();
    mockReset(prismaMock);
  });

  describe('getDashboardSummary', () => {
    it('should return comprehensive dashboard statistics', async () => {
      prismaMock.user.count.mockResolvedValue(100);
      prismaMock.salon.count.mockResolvedValue(50);
      prismaMock.artist.count.mockResolvedValue(75);
      prismaMock.review.count.mockResolvedValue(200);
      prismaMock.report.count.mockResolvedValue(5);
      prismaMock.verificationRequest.count.mockResolvedValue(3);

      prismaMock.salon.groupBy.mockImplementation(({ by }: any) => {
        if (by.includes('status')) return Promise.resolve([{ status: 'ACTIVE', _count: { id: 45 } }, { status: 'SUSPENDED', _count: { id: 5 } }]);
        if (by.includes('cityId')) return Promise.resolve([{ cityId: BigInt(1), _count: { id: 20 } }]);
        return Promise.resolve([]);
      });

      prismaMock.review.groupBy.mockResolvedValue([{ rating: 5, _count: { id: 150 } }, { rating: 4, _count: { id: 50 } }]);
      prismaMock.post.groupBy.mockResolvedValue([{ status: 'published', _count: { id: 10 } }]);
      prismaMock.city.findUnique.mockResolvedValue({ id: BigInt(1), nameFa: 'Tehran' });

      const result = await adminService.getDashboardSummary();

      expect(result.counts.users.total).toBe(100);
      expect(result.counts.salons.total).toBe(50);
      expect(result.distributions.salonStatus).toContainEqual({ status: 'ACTIVE', count: 45 });
      expect(result.topCities).toContainEqual({ name: 'Tehran', count: 20 });
    });
  });

  describe('getStats', () => {
    it('should return time-series data using raw queries', async () => {
      const mockDate = new Date('2023-01-01');
      prismaMock.$queryRawUnsafe.mockResolvedValue([
        { date: mockDate, count: 5 }
      ]);

      const result = await adminService.getStats('2023-01-01T00:00:00Z', '2023-01-31T00:00:00Z');

      expect(prismaMock.$queryRawUnsafe).toHaveBeenCalledTimes(5);
      expect(result.series.newUsers[0]).toEqual({ date: '2023-01-01', count: 5 });
    });
  });
});
