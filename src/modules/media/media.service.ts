import { prisma } from '../../shared/db/prisma';
import { ApiError } from '../../shared/errors/ApiError';
import { getStorageProvider } from '../../shared/storage';
import { mediaQueue, MEDIA_JOBS } from '../../shared/queues/media.queue';
import { MediaStatus, Media } from '@prisma/client';
import sharp from 'sharp';
import crypto from 'crypto';
import path from 'path';
import { config } from '../../config';
import { processImage } from '../../shared/utils/image';
import { secureFileKey } from '../../shared/utils/file';

export type UploadResult = Media | {
  message: string;
  mediaId: string;
  status: MediaStatus;
  url: string;
};

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
      data: data,
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
        status: data.status || MediaStatus.COMPLETED,
        uploadedBy,
        kind: data.kind,
        entityType: data.entityType,
        entityId: data.entityId ? BigInt(data.entityId) : undefined,
      },
    });
    return media;
  }

  async uploadAndOptimize(file: Express.Multer.File, uploadedBy: bigint): Promise<UploadResult> {
    if (!file.mimetype.startsWith('image/')) {
      throw new ApiError(400, 'Only image files are supported for optimization');
    }

    const baseStorageKey = secureFileKey(file.originalname);

    if (!config.worker.enableAsync) {
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
    const media = await prisma.media.findFirst({
      where: { id, deletedAt: null },
    });
    if (!media) throw new ApiError(404, 'Media not found');
    return media;
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

    return updated;
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
    const isReferenced = await this.checkMediaReferences(id);
    if (isReferenced) {
      throw new ApiError(409, 'Media is in use and cannot be deleted');
    }

    await prisma.media.update({
      where: { id },
      data: { deletedAt: new Date() }
    });
    return { ok: true };
  }

  private async checkMediaReferences(id: bigint) {
    const [
      salonAvatar, salonCover,
      artistAvatar, artistCover,
      postCover, postOg,
      authorAvatar,
      seoOg, seoTwitter,
      verificationDoc,
      artistCert,
      postAttachment
    ] = await Promise.all([
      prisma.salon.findFirst({ where: { avatarMediaId: id } }),
      prisma.salon.findFirst({ where: { coverMediaId: id } }),
      prisma.artist.findFirst({ where: { avatarMediaId: id } }),
      prisma.artist.findFirst({ where: { coverMediaId: id } }),
      prisma.post.findFirst({ where: { coverMediaId: id } }),
      prisma.post.findFirst({ where: { ogImageId: id } }),
      prisma.authorProfile.findFirst({ where: { avatarId: id } }),
      prisma.seoMeta.findFirst({ where: { ogImageMediaId: id } }),
      prisma.seoMeta.findFirst({ where: { twitterImageMediaId: id } }),
      prisma.verificationDocument.findFirst({ where: { mediaId: id } }),
      prisma.artistCertification.findFirst({ where: { mediaId: id } }),
      prisma.postMedia.findFirst({ where: { mediaId: id } }),
    ]);

    return !!(
      salonAvatar || salonCover ||
      artistAvatar || artistCover ||
      postCover || postOg ||
      authorAvatar ||
      seoOg || seoTwitter ||
      verificationDoc ||
      artistCert ||
      postAttachment
    );
  }
}
