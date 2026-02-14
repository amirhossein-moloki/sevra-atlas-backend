import { prisma } from '../../shared/db/prisma';
import { ApiError } from '../../shared/errors/ApiError';
import { handleSlugChange, initSeoMeta } from '../../shared/utils/seo';
import { EntityType, AccountStatus } from '@prisma/client';
import { CacheService } from '../../shared/redis/cache.service';
import { CacheKeys } from '../../shared/redis/cache-keys';

export class ArtistsService {
  async getArtists(filters: any) {
    const cacheKey = CacheKeys.ARTISTS_LIST(JSON.stringify(filters));

    return CacheService.wrap(cacheKey, async () => {
      const { q, city, neighborhood, specialty, verified, minRating, minReviewCount, sort, page = 1, pageSize = 20 } = filters;
    const limit = parseInt(pageSize as string) || 20;
    const skip = (parseInt(page as string || '1') - 1) * limit;

    const where: any = {
      status: AccountStatus.ACTIVE,
      deletedAt: null,
    };

    if (q) {
      where.OR = [
        { fullName: { contains: q as string, mode: 'insensitive' } },
        { bio: { contains: q as string, mode: 'insensitive' } },
        { summary: { contains: q as string, mode: 'insensitive' } },
      ];
    }

    if (city) where.city = { slug: city };
    if (neighborhood) where.neighborhood = { slug: neighborhood };
    if (specialty) where.specialties = { some: { specialty: { slug: specialty } } };
    if (verified === 'true') where.verification = 'VERIFIED';
    if (minRating) where.avgRating = { gte: parseFloat(minRating as string) };
    if (minReviewCount) where.reviewCount = { gte: parseInt(minReviewCount as string) };

    let orderBy: any = { createdAt: 'desc' };
    if (sort === 'rating') orderBy = { avgRating: 'desc' };
    if (sort === 'popular') orderBy = { reviewCount: 'desc' };
    if (sort === 'new') orderBy = { createdAt: 'desc' };

    const [data, total] = await Promise.all([
      prisma.artist.findMany({
        where,
        orderBy,
        skip,
        take: limit,
        include: { avatar: true, city: true, neighborhood: true },
      }),
      prisma.artist.count({ where }),
    ]);

      return {
        data: data,
        meta: { page: parseInt(page as string || '1'), pageSize: limit, total, totalPages: Math.ceil(total / limit) },
      };
    }, 300, { staleWhileRevalidate: 60 });
  }

  async getArtistBySlug(slug: string) {
    return CacheService.wrap(CacheKeys.ARTIST_DETAIL(slug), async () => {
      const artist = await prisma.artist.findFirst({
      where: { slug, deletedAt: null },
      include: {
        avatar: true,
        cover: true,
        city: true,
        neighborhood: true,
        specialties: { include: { specialty: true } },
        certifications: { include: { media: true } },
        salonArtists: { include: { salon: true } },
        seoMeta: true,
      },
    });

      if (!artist || artist.status !== AccountStatus.ACTIVE) {
        throw new ApiError(404, 'Artist not found');
      }

      return artist;
    }, 1800, { staleWhileRevalidate: 300 });
  }

  async createArtist(data: any, userId: bigint) {
    return prisma.$transaction(async (tx) => {
      const artist = await tx.artist.create({
        data: {
          fullName: data.fullName,
          slug: data.slug,
          summary: data.summary,
          bio: data.bio,
          primaryOwnerId: userId,
          owners: { connect: { id: userId } },
          cityId: data.cityId ? BigInt(data.cityId) : undefined,
          neighborhoodId: data.neighborhoodId ? BigInt(data.neighborhoodId) : undefined,
          avatarMediaId: data.avatarMediaId ? BigInt(data.avatarMediaId) : undefined,
          coverMediaId: data.coverMediaId ? BigInt(data.coverMediaId) : undefined,
        },
      });
      await initSeoMeta(EntityType.ARTIST, artist.id, artist.fullName, tx);
      // Invalidate
      await CacheService.delByPattern(CacheKeys.ARTISTS_LIST_PATTERN);
      if (artist.cityId) await CacheService.del(CacheKeys.CITY_STATS(artist.cityId));
      return artist;
    });
  }

  private async checkOwnership(tx: any, id: bigint, userId: bigint, isAdmin: boolean) {
    const artist = await tx.artist.findFirst({
      where: { id, deletedAt: null },
      include: { owners: { select: { id: true } } },
    });
    if (!artist) throw new ApiError(404, 'Artist not found');

    const isOwner = artist.owners.some((o: any) => o.id === userId);
    if (!isAdmin && !isOwner) {
      throw new ApiError(403, 'Forbidden');
    }
    return artist;
  }

  async updateArtist(id: bigint, data: any, userId: bigint, isAdmin: boolean) {
    return prisma.$transaction(async (tx) => {
      const artist = await this.checkOwnership(tx, id, userId, isAdmin);

      if (data.slug && data.slug !== artist.slug) {
        await handleSlugChange(EntityType.ARTIST, id, artist.slug, data.slug, '/atlas/artist', tx);
      }

      const updatedArtist = await tx.artist.update({
        where: { id },
        data: {
          fullName: data.fullName,
          slug: data.slug,
          summary: data.summary,
          bio: data.bio,
          cityId: data.cityId ? BigInt(data.cityId) : undefined,
          neighborhoodId: data.neighborhoodId ? BigInt(data.neighborhoodId) : undefined,
          avatarMediaId: data.avatarMediaId ? BigInt(data.avatarMediaId) : undefined,
          coverMediaId: data.coverMediaId ? BigInt(data.coverMediaId) : undefined,
        },
      });

      // Invalidate
      await CacheService.del(CacheKeys.ARTIST_DETAIL(artist.slug));
      await CacheService.delByPattern(CacheKeys.ARTISTS_LIST_PATTERN);
      return updatedArtist;
    });
  }

  async deleteArtist(id: bigint, userId: bigint, isAdmin: boolean) {
    await this.checkOwnership(prisma, id, userId, isAdmin);

    await prisma.artist.update({
      where: { id },
      data: { status: AccountStatus.DELETED, deletedAt: new Date() },
    });
    return { ok: true };
  }

  async attachMedia(id: bigint, data: { mediaId?: string | bigint; mediaIds?: (string | bigint)[] }, kind: 'AVATAR' | 'COVER' | 'GALLERY', userId: bigint, isAdmin: boolean) {
    await this.checkOwnership(prisma, id, userId, isAdmin);

    if (kind === 'GALLERY' && data.mediaIds) {
      const results = [];
      for (const mId of data.mediaIds) {
        const mediaId = BigInt(mId);
        const existingMedia = await prisma.media.findUnique({ where: { id: mediaId } });
        if (!existingMedia) throw new ApiError(404, `Media ${mId} not found`);

        if (!isAdmin && existingMedia.uploadedBy !== userId) {
          throw new ApiError(403, `You do not have permission to use media ${mId}`);
        }

        const updated = await prisma.media.update({
          where: { id: mediaId },
          data: {
            kind,
            entityType: EntityType.ARTIST,
            entityId: id,
          },
        });
        results.push(updated);
      }
      return results;
    }

    if (!data.mediaId) {
      throw new ApiError(400, 'mediaId is required');
    }

    const mediaId = BigInt(data.mediaId);
    const existingMedia = await prisma.media.findUnique({ where: { id: mediaId } });
    if (!existingMedia) throw new ApiError(404, 'Media not found');

    if (!isAdmin && existingMedia.uploadedBy !== userId) {
      throw new ApiError(403, 'You do not have permission to use this media');
    }

    // Update media metadata to link it to this artist
    await prisma.media.update({
      where: { id: mediaId },
      data: {
        kind,
        entityType: EntityType.ARTIST,
        entityId: id,
      },
    });

    if (kind === 'AVATAR') {
      await prisma.artist.update({ where: { id }, data: { avatarMediaId: mediaId } });
    } else if (kind === 'COVER') {
      await prisma.artist.update({ where: { id }, data: { coverMediaId: mediaId } });
    }

    const finalMedia = await prisma.media.findUnique({ where: { id: mediaId } });
    return finalMedia;
  }

  async addCertification(id: bigint, data: any, userId: bigint, isAdmin: boolean) {
    await this.checkOwnership(prisma, id, userId, isAdmin);

    let mediaId: bigint | undefined;
    if (data.mediaId) {
      mediaId = BigInt(data.mediaId);
      const existingMedia = await prisma.media.findUnique({ where: { id: mediaId } });
      if (!existingMedia) throw new ApiError(404, 'Media not found');

      if (!isAdmin && existingMedia.uploadedBy !== userId) {
        throw new ApiError(403, 'You do not have permission to use this media');
      }

      await prisma.media.update({
        where: { id: mediaId },
        data: {
          kind: 'CERTIFICATE',
          entityType: EntityType.ARTIST,
          entityId: id,
        }
      });
    }

    const cert = await prisma.artistCertification.create({
      data: {
        artistId: id,
        title: data.title,
        issuer: data.issuer,
        issuerSlug: data.issuerSlug,
        category: data.category,
        level: data.level,
        issuedAt: data.issuedAt ? new Date(data.issuedAt) : undefined,
        expiresAt: data.expiresAt ? new Date(data.expiresAt) : undefined,
        credentialId: data.credentialId,
        credentialUrl: data.credentialUrl,
        mediaId,
      },
    });

    return cert;
  }

  async updateCertification(certId: bigint, data: any, userId: bigint, isAdmin: boolean) {
    const cert = await prisma.artistCertification.findUnique({
      where: { id: certId },
    });
    if (!cert) throw new ApiError(404, 'Certification not found');

    await this.checkOwnership(prisma, cert.artistId, userId, isAdmin);

    const updated = await prisma.artistCertification.update({
      where: { id: certId },
      data: {
        title: data.title,
        issuer: data.issuer,
        issuerSlug: data.issuerSlug,
        category: data.category,
        level: data.level,
        credentialId: data.credentialId,
        credentialUrl: data.credentialUrl,
        mediaId: data.mediaId ? BigInt(data.mediaId) : undefined,
        issuedAt: data.issuedAt ? new Date(data.issuedAt) : undefined,
        expiresAt: data.expiresAt ? new Date(data.expiresAt) : undefined,
      },
    });
    return updated;
  }

  async deleteCertification(certId: bigint, userId: bigint, isAdmin: boolean) {
    const cert = await prisma.artistCertification.findUnique({
      where: { id: certId },
    });
    if (!cert) throw new ApiError(404, 'Certification not found');

    await this.checkOwnership(prisma, cert.artistId, userId, isAdmin);

    await prisma.artistCertification.delete({ where: { id: certId } });
    return { ok: true };
  }

  async verifyCertification(certId: bigint, isVerified: boolean, userId: bigint) {
    await prisma.artistCertification.update({
      where: { id: certId },
      data: {
        isVerified,
        verifiedAt: new Date(),
        verifiedById: userId,
      },
    });
    return { ok: true };
  }

  async listSpecialties() {
    return prisma.specialty.findMany({
      where: { deletedAt: null },
      orderBy: { order: 'asc' }
    });
  }

  async createSpecialty(data: any) {
    const specialty = await prisma.specialty.create({ data });
    return specialty;
  }

  async updateSpecialty(id: bigint, data: any) {
    const specialty = await prisma.specialty.update({
      where: { id },
      data,
    });
    return specialty;
  }

  async deleteSpecialty(id: bigint) {
    await prisma.specialty.update({
      where: { id },
      data: { deletedAt: new Date() }
    });
    return { ok: true };
  }

  async reorderSpecialties(items: { id: string | bigint, order: number }[]) {
    return prisma.$transaction(
      items.map(item => prisma.specialty.update({
        where: { id: BigInt(item.id) },
        data: { order: item.order }
      }))
    );
  }

  async assignSpecialties(id: bigint, specialtyIds: number[], mode: 'replace' | 'append', userId: bigint, isAdmin: boolean) {
    return prisma.$transaction(async (tx) => {
      await this.checkOwnership(tx, id, userId, isAdmin);

      if (mode === 'replace') {
        await tx.artistSpecialty.deleteMany({ where: { artistId: id } });
      }

      for (const sId of specialtyIds) {
        await tx.artistSpecialty.upsert({
          where: {
            artistId_specialtyId: { artistId: id, specialtyId: BigInt(sId) },
          },
          create: {
            artistId: id,
            specialtyId: BigInt(sId),
          },
          update: {},
        });
      }
      return { ok: true };
    });
  }

}
