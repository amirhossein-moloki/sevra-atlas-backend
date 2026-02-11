import { mockDeep, mockReset } from 'jest-mock-extended';

const prismaMock = mockDeep<any>();
const storageMock = mockDeep<any>();

jest.mock('../src/shared/db/prisma', () => ({
  __esModule: true,
  prisma: prismaMock,
}));

jest.mock('../src/shared/storage', () => ({
  getStorageProvider: jest.fn().mockReturnValue(storageMock),
}));

import { MediaService } from '../src/modules/media/media.service';
import sharp from 'sharp';

describe('MediaService', () => {
  let mediaService: MediaService;

  beforeEach(() => {
    mediaService = new MediaService();
    mockReset(prismaMock);
  });

  describe('uploadAndOptimize', () => {
    it('should process image and create media with variants', async () => {
      // Create a small 10x10 red dot image for testing
      const buffer = await sharp({
        create: {
          width: 10,
          height: 10,
          channels: 3,
          background: { r: 255, g: 0, b: 0 }
        }
      }).png().toBuffer();

      const mockFile = {
        buffer,
        mimetype: 'image/png',
        originalname: 'test.png',
      } as Express.Multer.File;

      storageMock.save.mockResolvedValue('/uploads/test.png');
      prismaMock.media.create.mockResolvedValue({
        id: BigInt(1),
        url: '/uploads/test.png',
        variants: {
          webp: { url: '/uploads/test_webp.webp' }
        }
      });

      const result = await mediaService.uploadAndOptimize(mockFile, BigInt(1));

      expect(result.variants).toBeDefined();
      expect(result.variants.webp).toBeDefined();
      expect(storageMock.save).toHaveBeenCalled();
      expect(prismaMock.media.create).toHaveBeenCalledWith(expect.objectContaining({
        data: expect.objectContaining({
          variants: expect.any(Object)
        })
      }));
    });

    it('should throw error for non-image files', async () => {
      const mockFile = {
        buffer: Buffer.from('test'),
        mimetype: 'text/plain',
        originalname: 'test.txt',
      } as Express.Multer.File;

      await expect(mediaService.uploadAndOptimize(mockFile, BigInt(1)))
        .rejects.toThrow('Only image files are supported for optimization');
    });
  });
});
