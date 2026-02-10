import { prisma } from '../../shared/db/prisma';
import { ApiError } from '../../shared/errors/ApiError';

export class MediaService {
  async listMedia(query: any) {
    const { page = 1, pageSize = 20 } = query;
    const limit = parseInt(pageSize as string) || 20;
    const skip = (parseInt(page as string || '1') - 1) * limit;

    const [data, total] = await Promise.all([
      prisma.media.findMany({
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.media.count(),
    ]);

    return {
      data: data.map(m => this.serialize(m)),
      meta: { page: parseInt(page), pageSize: limit, total, totalPages: Math.ceil(total / limit) },
    };
  }

  async createMedia(data: any, uploadedBy: bigint) {
    // In a real app, you'd handle AVIF conversion here
    const media = await prisma.media.create({
      data: {
        storageKey: data.storageKey,
        url: data.url,
        type: data.type || 'image',
        mime: data.mime,
        width: data.width,
        height: data.height,
        sizeBytes: data.sizeBytes || 0,
        altText: data.altText || '',
        title: data.title || '',
        uploadedBy,
        kind: data.kind,
        entityType: data.entityType,
        entityId: data.entityId ? BigInt(data.entityId) : undefined,
      },
    });
    return this.serialize(media);
  }

  async getMedia(id: bigint) {
    const media = await prisma.media.findUnique({
      where: { id },
    });
    if (!media) throw new ApiError(404, 'Media not found');
    return this.serialize(media);
  }

  async deleteMedia(id: bigint, userId: bigint, isAdmin: boolean) {
    const media = await prisma.media.findUnique({ where: { id } });
    if (!media) throw new ApiError(404, 'Media not found');

    if (!isAdmin && media.uploadedBy !== userId) {
      throw new ApiError(403, 'Forbidden');
    }

    // Check if referenced
    // (Simplified check)

    await prisma.media.delete({ where: { id } });
    return { ok: true };
  }

  private serialize(obj: any): any {
    if (!obj) return null;
    if (Array.isArray(obj)) return obj.map(o => this.serialize(o));
    const res = { ...obj };
    for (const key in res) {
      if (typeof res[key] === 'bigint') res[key] = res[key].toString();
      else if (typeof res[key] === 'object' && res[key] !== null && !(res[key] instanceof Date)) res[key] = this.serialize(res[key]);
    }
    return res;
  }
}
