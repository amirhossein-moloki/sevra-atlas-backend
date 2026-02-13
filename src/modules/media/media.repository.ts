import { prisma } from '../../shared/db/prisma';
import { TransactionClient } from '../../shared/db/tx';
import { MediaStatus, Prisma } from '@prisma/client';

export class MediaRepository {
  private db(tx?: TransactionClient) {
    return tx || prisma;
  }

  async findMany(params: {
    where: Prisma.MediaWhereInput;
    orderBy?: Prisma.MediaOrderByWithRelationInput;
    skip?: number;
    take?: number;
  }, tx?: TransactionClient) {
    const [data, total] = await Promise.all([
      this.db(tx).media.findMany(params),
      this.db(tx).media.count({ where: params.where }),
    ]);
    return { data, total };
  }

  async findUnique(id: bigint, tx?: TransactionClient) {
    return this.db(tx).media.findUnique({
      where: { id },
    });
  }

  async findFirst(where: Prisma.MediaWhereInput, tx?: TransactionClient) {
    return this.db(tx).media.findFirst({
      where,
    });
  }

  async create(data: Prisma.MediaUncheckedCreateInput, tx?: TransactionClient) {
    return this.db(tx).media.create({ data });
  }

  async update(id: bigint, data: Prisma.MediaUncheckedUpdateInput, tx?: TransactionClient) {
    return this.db(tx).media.update({
      where: { id },
      data,
    });
  }

  async softDelete(id: bigint, tx?: TransactionClient) {
    return this.db(tx).media.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  }

  async checkReferences(id: bigint, tx?: TransactionClient) {
    const db = this.db(tx);
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
      db.salon.findFirst({ where: { avatarMediaId: id } }),
      db.salon.findFirst({ where: { coverMediaId: id } }),
      db.artist.findFirst({ where: { avatarMediaId: id } }),
      db.artist.findFirst({ where: { coverMediaId: id } }),
      db.post.findFirst({ where: { coverMediaId: id } }),
      db.post.findFirst({ where: { ogImageId: id } }),
      db.authorProfile.findFirst({ where: { avatarId: id } }),
      db.seoMeta.findFirst({ where: { ogImageMediaId: id } }),
      db.seoMeta.findFirst({ where: { twitterImageMediaId: id } }),
      db.verificationDocument.findFirst({ where: { mediaId: id } }),
      db.artistCertification.findFirst({ where: { mediaId: id } }),
      db.postMedia.findFirst({ where: { mediaId: id } }),
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

export const mediaRepository = new MediaRepository();
