import { ApiError } from '../../shared/errors/ApiError';
import { getStorageProvider } from '../../shared/storage';
import { mediaQueue, MEDIA_JOBS } from '../../shared/queues/media.queue';
import { MediaStatus, Media, Prisma } from '@prisma/client';
import sharp from 'sharp';
import { env } from '../../shared/config/env';
import { processImage } from '../../shared/utils/image';
import { mediaRepository, MediaRepository } from './media.repository';

export type UploadResult = Media | {
  message: string;
  mediaId: string;
  status: MediaStatus;
  url: string;
};

export class MediaService {
  private storage = getStorageProvider();

  constructor(
    private readonly repo: MediaRepository = mediaRepository
  ) {}

  async listMedia(query: any) {
    const { page = 1, pageSize = 20 } = query;
    const limit = parseInt(pageSize as string) || 20;
    const skip = (parseInt(page as string || '1') - 1) * limit;

    const { data, total } = await this.repo.findMany({
      where: { deletedAt: null },
      orderBy: { createdAt: 'desc' },
      skip,
      take: limit,
    });

    return {
      data,
      meta: { page: parseInt(page as string || '1'), pageSize: limit, total, totalPages: Math.ceil(total / limit) },
    };
  }

  async createMedia(data: any, uploadedBy: bigint) {
    const media = await this.repo.create({
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
      status: data.status || MediaStatus.COMPLETED,
      uploadedBy,
      kind: data.kind,
      entityType: data.entityType,
      entityId: data.entityId ? BigInt(data.entityId) : undefined,
    });
    return media;
  }

  async uploadAndOptimize(file: Express.Multer.File, uploadedBy: bigint): Promise<UploadResult> {
    if (!file.mimetype.startsWith('image/')) {
      throw new ApiError(400, 'Only image files are supported for optimization');
    }

    const timestamp = Date.now();
    const baseStorageKey = `${timestamp}-${file.originalname}`;

    if (!env.ENABLE_ASYNC_WORKERS) {
      // SYNC MODE (Rollout Phase 0/1)
      const { original, variants } = await processImage(file.buffer);
      const originalUrl = await this.storage.save(baseStorageKey, file.buffer, file.mimetype);

      const variantUrls: any = {};
      for (const [key, variant] of Object.entries(variants)) {
        const ext = variant.mime.split('/')[1];
        const variantKey = `${baseStorageKey}_${key}.${ext}`;
        const url = await this.storage.save(variantKey, variant.buffer, variant.mime);
        variantUrls[key] = { url, mime: variant.mime, width: variant.width, height: variant.height, sizeBytes: variant.sizeBytes };
      }

      return this.createMedia({
        storageKey: baseStorageKey,
        url: originalUrl,
        type: 'image',
        mime: original.mime,
        width: original.width,
        height: original.height,
        sizeBytes: original.sizeBytes,
        variants: variantUrls,
        status: MediaStatus.COMPLETED,
      }, uploadedBy);
    }

    // ASYNC MODE (Rollout Phase 2+)
    const metadata = await sharp(file.buffer).metadata();
    const originalUrl = await this.storage.save(baseStorageKey, file.buffer, file.mimetype);

    const media = await this.createMedia({
      storageKey: baseStorageKey,
      url: originalUrl,
      type: 'image',
      mime: file.mimetype,
      width: metadata.width,
      height: metadata.height,
      sizeBytes: file.size,
      status: MediaStatus.PENDING,
    }, uploadedBy);

    await mediaQueue.add(MEDIA_JOBS.PROCESS_IMAGE, {
      mediaId: media.id.toString(),
      storageKey: baseStorageKey,
      mime: file.mimetype,
    }, { jobId: `media:${media.id}` });

    return {
      message: 'Upload successful. Processing variants in background.',
      mediaId: media.id.toString(),
      status: MediaStatus.PENDING,
      url: originalUrl,
    };
  }

  async getMedia(id: bigint) {
    const media = await this.repo.findFirst({ id, deletedAt: null });
    if (!media) throw new ApiError(404, 'Media not found');
    return media;
  }

  async updateMedia(id: bigint, data: any, userId: bigint, isAdmin: boolean) {
    const media = await this.repo.findFirst({ id, deletedAt: null });
    if (!media) throw new ApiError(404, 'Media not found');

    if (!isAdmin && media.uploadedBy !== userId) {
      throw new ApiError(403, 'Forbidden');
    }

    const updated = await this.repo.update(id, data);

    return updated;
  }

  async deleteMedia(id: bigint, userId: bigint, isAdmin: boolean) {
    const media = await this.repo.findFirst({ id, deletedAt: null });
    if (!media) throw new ApiError(404, 'Media not found');

    if (!isAdmin && media.uploadedBy !== userId) {
      throw new ApiError(403, 'Forbidden');
    }

    // Check if referenced
    const isReferenced = await this.repo.checkReferences(id);
    if (isReferenced) {
      throw new ApiError(409, 'Media is in use and cannot be deleted');
    }

    await this.repo.softDelete(id);
    return { ok: true };
  }
}
