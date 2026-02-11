import { prisma } from '../../shared/db/prisma';
import { ApiError } from '../../shared/errors/ApiError';
import { serialize } from '../../shared/utils/serialize';
import { processImage } from '../../shared/utils/image';
import { getStorageProvider } from '../../shared/storage';

export class MediaService {
  private storage = getStorageProvider();

  async listMedia(query: any) {
    const { page = 1, pageSize = 20 } = query;
    const limit = parseInt(pageSize as string) || 20;
    const skip = (parseInt(page as string || '1') - 1) * limit;

    const [data, total] = await Promise.all([
      prisma.media.findMany({
        where: { deletedAt: null },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.media.count({ where: { deletedAt: null } }),
    ]);

    return {
      data: serialize(data),
      meta: { page: parseInt(page), pageSize: limit, total, totalPages: Math.ceil(total / limit) },
    };
  }

  async createMedia(data: any, uploadedBy: bigint) {
    const media = await prisma.media.create({
      data: {
        storageKey: data.storageKey,
        url: data.url,
        type: data.type || 'image',
        mime: data.mime,
        width: data.width,
        height: data.height,
        sizeBytes: data.sizeBytes || 0,
        variants: data.variants || {},
        altText: data.altText || '',
        title: data.title || '',
        uploadedBy,
        kind: data.kind,
        entityType: data.entityType,
        entityId: data.entityId ? BigInt(data.entityId) : undefined,
      },
    });
    return serialize(media);
  }

  async uploadAndOptimize(file: Express.Multer.File, uploadedBy: bigint) {
    if (!file.mimetype.startsWith('image/')) {
      throw new ApiError(400, 'Only image files are supported for optimization');
    }

    const { original, variants } = await processImage(file.buffer);

    const timestamp = Date.now();
    const baseStorageKey = `${timestamp}-${file.originalname}`;

    // Save original
    const originalUrl = await this.storage.save(baseStorageKey, file.buffer, file.mimetype);

    const variantUrls: any = {};
    await Promise.all(Object.entries(variants).map(async ([key, variant]) => {
      const ext = variant.mime.split('/')[1];
      const variantKey = `${baseStorageKey}_${key}.${ext}`;
      const url = await this.storage.save(variantKey, variant.buffer, variant.mime);

      variantUrls[key] = {
        url,
        mime: variant.mime,
        width: variant.width,
        height: variant.height,
        sizeBytes: variant.sizeBytes,
      };
    }));

    return this.createMedia({
      storageKey: baseStorageKey,
      url: originalUrl,
      type: 'image',
      mime: original.mime,
      width: original.width,
      height: original.height,
      sizeBytes: original.sizeBytes,
      variants: variantUrls,
    }, uploadedBy);
  }

  async getMedia(id: bigint) {
    const media = await prisma.media.findFirst({
      where: { id, deletedAt: null },
    });
    if (!media) throw new ApiError(404, 'Media not found');
    return serialize(media);
  }

  async updateMedia(id: bigint, data: any, userId: bigint, isAdmin: boolean) {
    const media = await prisma.media.findFirst({
      where: { id, deletedAt: null }
    });
    if (!media) throw new ApiError(404, 'Media not found');

    if (!isAdmin && media.uploadedBy !== userId) {
      throw new ApiError(403, 'Forbidden');
    }

    const updated = await prisma.media.update({
      where: { id },
      data,
    });

    return serialize(updated);
  }

  async deleteMedia(id: bigint, userId: bigint, isAdmin: boolean) {
    const media = await prisma.media.findFirst({
      where: { id, deletedAt: null }
    });
    if (!media) throw new ApiError(404, 'Media not found');

    if (!isAdmin && media.uploadedBy !== userId) {
      throw new ApiError(403, 'Forbidden');
    }

    // Check if referenced
    // (Simplified check)

    await prisma.media.update({
      where: { id },
      data: { deletedAt: new Date() }
    });
    return { ok: true };
  }
}
