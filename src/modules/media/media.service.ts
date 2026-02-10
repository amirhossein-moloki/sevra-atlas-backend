import { prisma } from '../../shared/db/prisma';

export class MediaService {
  async createMedia(data: any, uploadedBy: bigint) {
    return prisma.media.create({
      data: {
        ...data,
        uploadedBy,
        entityId: data.entityId ? BigInt(data.entityId) : undefined,
      },
    });
  }

  async getMedia(id: bigint) {
    return prisma.media.findUnique({
      where: { id },
    });
  }
}
