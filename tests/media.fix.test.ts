import { mockDeep, mockReset } from 'jest-mock-extended';
import { ApiError } from '../src/shared/errors/ApiError';

const prismaMock = mockDeep<any>();

jest.mock('../src/shared/db/prisma', () => ({
  __esModule: true,
  prisma: prismaMock,
}));

import { MediaService } from '../src/modules/media/media.service';

describe('MediaService Fixes', () => {
  let mediaService: MediaService;

  beforeEach(() => {
    mediaService = new MediaService();
    mockReset(prismaMock);
  });

  describe('deleteMedia with reference check', () => {
    it('should throw 409 if media is referenced by a salon avatar', async () => {
      prismaMock.media.findFirst.mockResolvedValueOnce({ id: BigInt(1), uploadedBy: BigInt(1) });

      // Simulate salon using this media as avatar
      prismaMock.salon.findFirst.mockResolvedValueOnce({ id: BigInt(100) });
      // Other checks return null
      prismaMock.salon.findFirst.mockResolvedValue(null);
      prismaMock.artist.findFirst.mockResolvedValue(null);
      prismaMock.post.findFirst.mockResolvedValue(null);
      prismaMock.authorProfile.findFirst.mockResolvedValue(null);
      prismaMock.seoMeta.findFirst.mockResolvedValue(null);
      prismaMock.verificationDocument.findFirst.mockResolvedValue(null);
      prismaMock.artistCertification.findFirst.mockResolvedValue(null);
      prismaMock.postMedia.findFirst.mockResolvedValue(null);

      await expect(mediaService.deleteMedia(BigInt(1), BigInt(1), false))
        .rejects.toThrow(new ApiError(409, 'Media is in use and cannot be deleted'));
    });

    it('should allow deletion if not referenced', async () => {
      prismaMock.media.findFirst.mockResolvedValueOnce({ id: BigInt(1), uploadedBy: BigInt(1) });

      // All checks return null
      prismaMock.salon.findFirst.mockResolvedValue(null);
      prismaMock.artist.findFirst.mockResolvedValue(null);
      prismaMock.post.findFirst.mockResolvedValue(null);
      prismaMock.authorProfile.findFirst.mockResolvedValue(null);
      prismaMock.seoMeta.findFirst.mockResolvedValue(null);
      prismaMock.verificationDocument.findFirst.mockResolvedValue(null);
      prismaMock.artistCertification.findFirst.mockResolvedValue(null);
      prismaMock.postMedia.findFirst.mockResolvedValue(null);

      prismaMock.media.update.mockResolvedValue({ id: BigInt(1), deletedAt: new Date() });

      const result = await mediaService.deleteMedia(BigInt(1), BigInt(1), false);
      expect(result.ok).toBe(true);
      expect(prismaMock.media.update).toHaveBeenCalled();
    });
  });
});
