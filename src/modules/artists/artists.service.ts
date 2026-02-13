import { ApiError } from '../../shared/errors/ApiError';
import { handleSlugChange, initSeoMeta } from '../../shared/utils/seo';
import { EntityType, AccountStatus } from '@prisma/client';
import { CacheService } from '../../shared/redis/cache.service';
import { CacheKeys } from '../../shared/redis/cache-keys';
import { artistsRepository, ArtistsRepository } from './artists.repository';
import { mediaRepository, MediaRepository } from '../media/media.repository';
import { withTx } from '../../shared/db/tx';
import { ArtistQueryFragments } from '../../shared/db/queryFragments';

export class ArtistsService {
  constructor(
    private readonly repo: ArtistsRepository = artistsRepository,
    private readonly mediaRepo: MediaRepository = mediaRepository
  ) {}

  async getArtists(filters: any) {
    const cacheKey = CacheKeys.ARTISTS_LIST(JSON.stringify(filters));

    return CacheService.wrap(cacheKey, async () => {
      const page = parseInt(filters.page as string || '1');
      const pageSize = parseInt(filters.pageSize as string || '20');
      const skip = (page - 1) * pageSize;

      const { data, total } = await this.repo.findArtists({
        ...filters,
        skip,
        take: pageSize,
      });

      return {
        data,
        meta: { page, pageSize, total, totalPages: Math.ceil(total / pageSize) },
      };
    }, 300, { staleWhileRevalidate: 60 });
  }

  async getArtistBySlug(slug: string) {
    return CacheService.wrap(CacheKeys.ARTIST_DETAIL(slug), async () => {
      const artist = await this.repo.findBySlug(slug, ArtistQueryFragments.DETAIL_INCLUDE);

      if (!artist || artist.status !== AccountStatus.ACTIVE) {
        throw new ApiError(404, 'Artist not found');
      }

      return artist;
    }, 1800, { staleWhileRevalidate: 300 });
  }

  async createArtist(data: any, userId: bigint) {
    return withTx(async (tx) => {
      const artist = await this.repo.create({
        ...data,
        primaryOwnerId: userId,
        owners: { connect: { id: userId } },
        cityId: data.cityId ? BigInt(data.cityId) : undefined,
        neighborhoodId: data.neighborhoodId ? BigInt(data.neighborhoodId) : undefined,
      }, tx);
      await initSeoMeta(EntityType.ARTIST, artist.id, artist.fullName, tx);
      // Invalidate
      await CacheService.delByPattern(CacheKeys.ARTISTS_LIST_PATTERN);
      if (artist.cityId) await CacheService.del(CacheKeys.CITY_STATS(artist.cityId));
      return artist;
    });
  }

  private async checkOwnership(id: bigint, userId: bigint, isAdmin: boolean, tx?: any) {
    const artist = await this.repo.findFirst({ id, deletedAt: null }, { owners: { select: { id: true } } }, tx);
    if (!artist) throw new ApiError(404, 'Artist not found');

    const isOwner = (artist.owners as any[]).some((o: any) => o.id === userId);
    if (!isAdmin && !isOwner) {
      throw new ApiError(403, 'Forbidden');
    }
    return artist;
  }

  async updateArtist(id: bigint, data: any, userId: bigint, isAdmin: boolean) {
    return withTx(async (tx) => {
      const artist = await this.checkOwnership(id, userId, isAdmin, tx);

      if (data.slug && data.slug !== artist.slug) {
        await handleSlugChange(EntityType.ARTIST, id, artist.slug, data.slug, '/atlas/artist', tx);
      }

      const updatedArtist = await this.repo.update(id, {
        ...data,
        cityId: data.cityId ? BigInt(data.cityId) : undefined,
        neighborhoodId: data.neighborhoodId ? BigInt(data.neighborhoodId) : undefined,
        avatarMediaId: data.avatarMediaId ? BigInt(data.avatarMediaId) : undefined,
        coverMediaId: data.coverMediaId ? BigInt(data.coverMediaId) : undefined,
      }, tx);

      // Invalidate
      await CacheService.del(CacheKeys.ARTIST_DETAIL(artist.slug));
      await CacheService.delByPattern(CacheKeys.ARTISTS_LIST_PATTERN);
      return updatedArtist;
    });
  }

  async deleteArtist(id: bigint, userId: bigint, isAdmin: boolean) {
    await this.checkOwnership(id, userId, isAdmin);

    await this.repo.softDelete(id);
    return { ok: true };
  }

  async attachMedia(id: bigint, data: { mediaId?: string | bigint; mediaIds?: (string | bigint)[] }, kind: 'AVATAR' | 'COVER' | 'GALLERY', userId: bigint, isAdmin: boolean) {
    await this.checkOwnership(id, userId, isAdmin);

    if (kind === 'GALLERY' && data.mediaIds) {
      const results = [];
      for (const mId of data.mediaIds) {
        const mediaId = BigInt(mId);
        const existingMedia = await this.mediaRepo.findUnique(mediaId);
        if (!existingMedia) throw new ApiError(404, `Media ${mId} not found`);

        if (!isAdmin && existingMedia.uploadedBy !== userId) {
          throw new ApiError(403, `You do not have permission to use media ${mId}`);
        }

        const updated = await this.mediaRepo.update(mediaId, {
          kind,
          entityType: EntityType.ARTIST,
          entityId: id,
        });
        results.push(updated);
      }
      return results;
    }

    if (!data.mediaId) {
      throw new ApiError(400, 'mediaId is required');
    }

    const mediaId = BigInt(data.mediaId);
    const existingMedia = await this.mediaRepo.findUnique(mediaId);
    if (!existingMedia) throw new ApiError(404, 'Media not found');

    if (!isAdmin && existingMedia.uploadedBy !== userId) {
      throw new ApiError(403, 'You do not have permission to use this media');
    }

    // Update media metadata to link it to this artist
    await this.mediaRepo.update(mediaId, {
      kind,
      entityType: EntityType.ARTIST,
      entityId: id,
    });

    if (kind === 'AVATAR') {
      await this.repo.update(id, { avatarMediaId: mediaId });
    } else if (kind === 'COVER') {
      await this.repo.update(id, { coverMediaId: mediaId });
    }

    const finalMedia = await this.mediaRepo.findUnique(mediaId);
    return finalMedia;
  }

  async addCertification(id: bigint, data: any, userId: bigint, isAdmin: boolean) {
    await this.checkOwnership(id, userId, isAdmin);

    let mediaId: bigint | undefined;
    if (data.mediaId) {
      mediaId = BigInt(data.mediaId);
      const existingMedia = await this.mediaRepo.findUnique(mediaId);
      if (!existingMedia) throw new ApiError(404, 'Media not found');

      if (!isAdmin && existingMedia.uploadedBy !== userId) {
        throw new ApiError(403, 'You do not have permission to use this media');
      }

      await this.mediaRepo.update(mediaId, {
        kind: 'CERTIFICATE',
        entityType: EntityType.ARTIST,
        entityId: id,
      });
    }

    const cert = await this.repo.createCertification({
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
    });

    return cert;
  }

  async updateCertification(certId: bigint, data: any, userId: bigint, isAdmin: boolean) {
    const cert = await this.repo.findCertificationUnique(certId);
    if (!cert) throw new ApiError(404, 'Certification not found');

    await this.checkOwnership(cert.artistId, userId, isAdmin);

    const updated = await this.repo.updateCertification(certId, {
      ...data,
      issuedAt: data.issuedAt ? new Date(data.issuedAt) : undefined,
      expiresAt: data.expiresAt ? new Date(data.expiresAt) : undefined,
    });
    return updated;
  }

  async deleteCertification(certId: bigint, userId: bigint, isAdmin: boolean) {
    const cert = await this.repo.findCertificationUnique(certId);
    if (!cert) throw new ApiError(404, 'Certification not found');

    await this.checkOwnership(cert.artistId, userId, isAdmin);

    await this.repo.deleteCertification(certId);
    return { ok: true };
  }

  async verifyCertification(certId: bigint, isVerified: boolean, userId: bigint) {
    await this.repo.updateCertification(certId, {
      isVerified,
      verifiedAt: new Date(),
      verifiedById: userId,
    });
    return { ok: true };
  }

  async listSpecialties() {
    return this.repo.findSpecialties();
  }

  async createSpecialty(data: any) {
    return this.repo.createSpecialty(data);
  }

  async updateSpecialty(id: bigint, data: any) {
    return this.repo.updateSpecialty(id, data);
  }

  async deleteSpecialty(id: bigint) {
    await this.repo.deleteSpecialty(id);
    return { ok: true };
  }

  async reorderSpecialties(items: { id: string | bigint, order: number }[]) {
    return withTx(async (tx) => {
      const results = [];
      for (const item of items) {
        const updated = await this.repo.updateSpecialty(BigInt(item.id), { order: item.order }, tx);
        results.push(updated);
      }
      return results;
    });
  }

  async assignSpecialties(id: bigint, specialtyIds: number[], mode: 'replace' | 'append', userId: bigint, isAdmin: boolean) {
    return withTx(async (tx) => {
      await this.checkOwnership(id, userId, isAdmin, tx);

      if (mode === 'replace') {
        await this.repo.deleteSpecialties(id, tx);
      }

      for (const sId of specialtyIds) {
        await this.repo.upsertSpecialty(id, BigInt(sId), tx);
      }
      return { ok: true };
    });
  }

}
