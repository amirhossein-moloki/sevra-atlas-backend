import { mockDeep, mockReset } from 'jest-mock-extended';
import { ApiError } from '../src/shared/errors/ApiError';

const prismaMock = mockDeep<any>();

jest.mock('../src/shared/db/prisma', () => ({
  __esModule: true,
  prisma: prismaMock,
}));

import { SalonsService } from '../src/modules/salons/salons.service';

describe('SalonsService Media Fixes', () => {
  let salonsService: SalonsService;

  beforeEach(() => {
    salonsService = new SalonsService();
    mockReset(prismaMock);
  });

  describe('attachMedia', () => {
    it('should link an existing media by ID', async () => {
      const salonId = BigInt(100);
      const mediaId = BigInt(1);
      const userId = BigInt(2);

      // checkOwnership mock
      prismaMock.salon.findUnique.mockResolvedValueOnce({
        id: salonId,
        owners: [{ id: userId }]
      });

      // Media existence check
      prismaMock.media.findUnique.mockResolvedValueOnce({
        id: mediaId,
        uploadedBy: userId
      });

      // Mock update calls
      prismaMock.media.update.mockResolvedValueOnce({ id: mediaId });
      prismaMock.salon.update.mockResolvedValueOnce({ id: salonId });
      prismaMock.media.findUnique.mockResolvedValueOnce({ id: mediaId, url: 'test-url' });

      const result = await salonsService.attachMedia(
        salonId,
        { mediaId: mediaId.toString() },
        'AVATAR',
        userId,
        false
      );

      expect(prismaMock.media.update).toHaveBeenCalledWith(expect.objectContaining({
        where: { id: mediaId },
        data: expect.objectContaining({ entityId: salonId, kind: 'AVATAR' })
      }));
      expect(prismaMock.salon.update).toHaveBeenCalledWith(expect.objectContaining({
        where: { id: salonId },
        data: { avatarMediaId: mediaId }
      }));
      expect(result.url).toBe('test-url');
    });

    it('should throw error if linking media not owned by user', async () => {
       const salonId = BigInt(100);
      const mediaId = BigInt(1);
      const userId = BigInt(2);
      const otherUserId = BigInt(3);

      // checkOwnership mock
      prismaMock.salon.findUnique.mockResolvedValueOnce({
        id: salonId,
        owners: [{ id: userId }]
      });

      // Media existence check - owned by someone else
      prismaMock.media.findUnique.mockResolvedValueOnce({
        id: mediaId,
        uploadedBy: otherUserId
      });

      await expect(salonsService.attachMedia(
        salonId,
        { mediaId: mediaId.toString() },
        'AVATAR',
        userId,
        false
      )).rejects.toThrow(new ApiError(403, 'You do not have permission to use this media'));
    });
  });
});
