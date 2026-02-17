import { prisma } from '../../shared/db/prisma';
import { ApiError } from '../../shared/errors/ApiError';
import { handleSlugChange, initSeoMeta } from '../../shared/utils/seo';
import { EntityType, AccountStatus, Prisma } from '@prisma/client';
import { CacheService } from '../../shared/redis/cache.service';
import { CacheKeys } from '../../shared/redis/cache-keys';
import { pickAllowedFields } from '../../shared/utils/object';
import { safeBigInt } from '../../shared/utils/bigint';

export class ArtistsService {
  private readonly allowedFields = [
    'fullName', 'slug', 'summary', 'bio', 'phone', 'instagram', 'website',
    'cityId', 'neighborhoodId', 'avatarMediaId', 'coverMediaId'
  ] as const;

  private readonly publicArtistFields = {
    id: true,
    fullName: true,
    slug: true,
    summary: true,
    bio: true,
    phone: true,
    instagram: true,
    website: true,
    avgRating: true,
    reviewCount: true,
    verification: true,
    status: true,
    cityId: true,
    neighborhoodId: true,
    avatarMediaId: true,
    coverMediaId: true,
    seoMetaId: true,
    planId: true,
    subscriptionStatus: true,
    featuredUntil: true,
    createdAt: true,
    updatedAt: true,
  };

  async findArtistByIdentifier(identifier: string) {
    const where: Prisma.ArtistWhereInput = { deletedAt: null };
    if (!isNaN(Number(identifier)) && /^\d+$/.test(identifier)) {
      where.id = safeBigInt(identifier, 'artist_id');
    } else {
      where.slug = identifier;
    }
    return prisma.artist.findFirst({ where });
  }

  async getArtists(filters: Record<string, unknown>) {
    const cacheKey = CacheKeys.ARTISTS_LIST(JSON.stringify(filters));

    return CacheService.wrap(cacheKey, async () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { q, city, neighborhood, specialty, verified, minRating, minReviewCount, sort, page = 1, pageSize = 20 } = filters as any;
    const limit = parseInt(pageSize as string) || 20;
    const skip = (parseInt(page as string || '1') - 1) * limit;

    const where: Prisma.ArtistWhereInput = {
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

    if (city) where.city = { slug: city as string };
    if (neighborhood) where.neighborhood = { slug: neighborhood as string };
    if (specialty) where.specialties = { some: { specialty: { slug: specialty as string } } };
    if (verified === 'true') where.verification = 'VERIFIED';
    if (minRating) where.avgRating = { gte: parseFloat(minRating as string) };
    if (minReviewCount) where.reviewCount = { gte: parseInt(minReviewCount as string) };

    let orderBy: Prisma.ArtistOrderByWithRelationInput = { visibilityScore: 'desc' };
    if (sort === 'rating') orderBy = { avgRating: 'desc' };
    if (sort === 'popular') orderBy = { reviewCount: 'desc' };
    if (sort === 'new') orderBy = { createdAt: 'desc' };

    const [data, total] = await Promise.all([
      prisma.artist.findMany({
        where,
        select: {
          ...this.publicArtistFields,
          avatar: true,
          city: true,
          neighborhood: true,
          plan: true,
        },
        orderBy,
        skip,
        take: limit,
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
      select: {
        ...this.publicArtistFields,
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

  async createArtist(data: Record<string, unknown>, userId: bigint) {
    const safeData = pickAllowedFields(data, [...this.allowedFields]) as Record<string, unknown>;

    return prisma.$transaction(async (tx) => {
      const artist = await tx.artist.create({
        data: {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          ...(safeData as any),
          cityId: safeData.cityId ? safeBigInt(safeData.cityId, 'cityId') : undefined,
          neighborhoodId: safeData.neighborhoodId ? safeBigInt(safeData.neighborhoodId, 'neighborhoodId') : undefined,
          avatarMediaId: safeData.avatarMediaId ? safeBigInt(safeData.avatarMediaId, 'avatarMediaId') : undefined,
          coverMediaId: safeData.coverMediaId ? safeBigInt(safeData.coverMediaId, 'coverMediaId') : undefined,
          primaryOwnerId: userId,
          owners: { connect: { id: userId } },
        },
        select: this.publicArtistFields,
      });
      await initSeoMeta(EntityType.ARTIST, artist.id, artist.fullName, tx);
      // Invalidate
      await CacheService.delByPattern(CacheKeys.ARTISTS_LIST_PATTERN);
      if (artist.cityId) await CacheService.del(CacheKeys.CITY_STATS(artist.cityId));
      return artist;
    });
  }

  private async checkOwnership(tx: Prisma.TransactionClient | typeof prisma, id: bigint, userId: bigint, isAdmin: boolean) {
    const artist = await tx.artist.findFirst({
      where: { id, deletedAt: null },
      include: { owners: { select: { id: true } } },
    });
    if (!artist) throw new ApiError(404, 'Artist not found');

    const isOwner = artist.owners.some((o: { id: bigint }) => o.id === userId);
    if (!isAdmin && !isOwner) {
      throw new ApiError(403, 'Forbidden');
    }
    return artist;
  }

  async updateArtist(id: bigint, data: Record<string, unknown>, userId: bigint, isAdmin: boolean) {
    const safeData = pickAllowedFields(data, [...this.allowedFields]) as Record<string, unknown>;

    return prisma.$transaction(async (tx) => {
      const artist = await this.checkOwnership(tx, id, userId, isAdmin);

      if (safeData.slug && safeData.slug !== artist.slug) {
        await handleSlugChange(EntityType.ARTIST, id, artist.slug, safeData.slug as string, '/atlas/artist', tx);
      }

      const updatedArtist = await tx.artist.update({
        where: { id },
        data: {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          ...(safeData as any),
          cityId: safeData.cityId ? safeBigInt(safeData.cityId, 'cityId') : undefined,
          neighborhoodId: safeData.neighborhoodId ? safeBigInt(safeData.neighborhoodId, 'neighborhoodId') : undefined,
          avatarMediaId: safeData.avatarMediaId ? safeBigInt(safeData.avatarMediaId, 'avatarMediaId') : undefined,
          coverMediaId: safeData.coverMediaId ? safeBigInt(safeData.coverMediaId, 'coverMediaId') : undefined,
        },
        select: this.publicArtistFields,
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
      const mediaIds = data.mediaIds.map(mId => safeBigInt(mId, 'mediaId'));

      // Ownership check for all media items
      if (!isAdmin) {
        const count = await prisma.media.count({
          where: {
            id: { in: mediaIds },
            uploadedBy: userId,
          },
        });
        if (count !== mediaIds.length) {
          throw new ApiError(403, 'You do not have permission to use one or more of the provided media items');
        }
      }

      await prisma.media.updateMany({
        where: { id: { in: mediaIds } },
        data: {
          kind,
          entityType: EntityType.ARTIST,
          entityId: id,
        },
      });

      return prisma.media.findMany({ where: { id: { in: mediaIds } } });
    }

    if (!data.mediaId) {
      throw new ApiError(400, 'mediaId is required');
    }

    const mediaId = safeBigInt(data.mediaId, 'mediaId');
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

  async addCertification(id: bigint, data: Record<string, unknown>, userId: bigint, isAdmin: boolean) {
    await this.checkOwnership(prisma, id, userId, isAdmin);

    let mediaId: bigint | undefined;
    if (data.mediaId) {
      mediaId = safeBigInt(data.mediaId, 'mediaId');
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
        title: data.title as string,
        issuer: data.issuer as string,
        issuerSlug: data.issuerSlug as string,
        category: data.category as string,
        level: data.level as string,
        issuedAt: data.issuedAt ? new Date(data.issuedAt as string) : undefined,
        expiresAt: data.expiresAt ? new Date(data.expiresAt as string) : undefined,
        credentialId: data.credentialId as string,
        credentialUrl: data.credentialUrl as string,
        mediaId,
      },
    });

    return cert;
  }

  async updateCertification(certId: bigint, data: Record<string, unknown>, userId: bigint, isAdmin: boolean) {
    const cert = await prisma.artistCertification.findUnique({
      where: { id: certId },
    });
    if (!cert) throw new ApiError(404, 'Certification not found');

    await this.checkOwnership(prisma, cert.artistId, userId, isAdmin);

    const updated = await prisma.artistCertification.update({
      where: { id: certId },
      data: {
        title: data.title as string,
        issuer: data.issuer as string,
        issuerSlug: data.issuerSlug as string,
        category: data.category as string,
        level: data.level as string,
        credentialId: data.credentialId as string,
        credentialUrl: data.credentialUrl as string,
        mediaId: data.mediaId ? safeBigInt(data.mediaId, 'mediaId') : undefined,
        issuedAt: data.issuedAt ? new Date(data.issuedAt as string) : undefined,
        expiresAt: data.expiresAt ? new Date(data.expiresAt as string) : undefined,
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

  async createSpecialty(data: Record<string, unknown>) {
    const safeData = pickAllowedFields(data, ['nameFa', 'slug', 'order']);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const specialty = await prisma.specialty.create({ data: safeData as any });
    return specialty;
  }

  async updateSpecialty(id: bigint, data: Record<string, unknown>) {
    const safeData = pickAllowedFields(data, ['nameFa', 'slug', 'order']);
    const specialty = await prisma.specialty.update({
      where: { id },
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      data: safeData as any,
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

      const sIds = specialtyIds.map(sId => safeBigInt(sId, 'specialtyId'));

      if (mode === 'replace') {
        await tx.artistSpecialty.deleteMany({ where: { artistId: id } });
      }

      await tx.artistSpecialty.createMany({
        data: sIds.map(specialtyId => ({
          artistId: id,
          specialtyId,
        })),
        skipDuplicates: true,
      });

      return { ok: true };
    });
  }

}
