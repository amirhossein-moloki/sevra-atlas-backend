import { mockDeep, mockReset } from 'jest-mock-extended';
import { SalonsService } from '../../src/modules/salons/salons.service';
import { SalonsRepository } from '../../src/modules/salons/salons.repository';
import { MediaRepository } from '../../src/modules/media/media.repository';
import { AccountStatus } from '@prisma/client';
import { CacheService } from '../../src/shared/redis/cache.service';

// Mock CacheService
jest.mock('../../src/shared/redis/cache.service', () => ({
  CacheService: {
    wrap: jest.fn((key, fn) => fn()),
    del: jest.fn(),
    delByPattern: jest.fn(),
  },
}));

describe('SalonsService (with Repository Mocking)', () => {
  const salonsRepoMock = mockDeep<SalonsRepository>();
  const mediaRepoMock = mockDeep<MediaRepository>();
  let salonsService: SalonsService;

  beforeEach(() => {
    mockReset(salonsRepoMock);
    mockReset(mediaRepoMock);
    // Inject the mocks via constructor
    salonsService = new SalonsService(salonsRepoMock, mediaRepoMock);
  });

  describe('getSalonBySlug', () => {
    it('should return a salon when it exists and is active', async () => {
      const mockSalon = {
        id: BigInt(1),
        slug: 'test-salon',
        status: AccountStatus.ACTIVE,
        name: 'Test Salon',
      };

      salonsRepoMock.findBySlug.mockResolvedValue(mockSalon as any);

      const result = await salonsService.getSalonBySlug('test-salon');

      expect(result).toEqual(mockSalon);
      expect(salonsRepoMock.findBySlug).toHaveBeenCalledWith('test-salon', expect.any(Object));
      expect(CacheService.wrap).toHaveBeenCalled();
    });

    it('should throw ApiError when salon is not found', async () => {
      salonsRepoMock.findBySlug.mockResolvedValue(null);

      await expect(salonsService.getSalonBySlug('non-existent')).rejects.toThrow('Salon not found');
    });

    it('should throw ApiError when salon is not active', async () => {
      salonsRepoMock.findBySlug.mockResolvedValue({
        status: AccountStatus.SUSPENDED,
      } as any);

      await expect(salonsService.getSalonBySlug('suspended-salon')).rejects.toThrow('Salon not found');
    });
  });
});
