import { ApiError } from '../../shared/errors/ApiError';
import { handleSlugChange, initSeoMeta } from '../../shared/utils/seo';
import { EntityType, AccountStatus } from '@prisma/client';
import { CacheService } from '../../shared/redis/cache.service';
import { CacheKeys } from '../../shared/redis/cache-keys';
import { salonsRepository, SalonsRepository } from './salons.repository';
import { mediaRepository, MediaRepository } from '../media/media.repository';
import { withTx } from '../../shared/db/tx';
import { SalonQueryFragments } from '../../shared/db/queryFragments';

export class SalonsService {
  constructor(
    private readonly repo: SalonsRepository = salonsRepository,
    private readonly mediaRepo: MediaRepository = mediaRepository
  ) {}

  async getSalons(filters: any) {
    const cacheKey = CacheKeys.SALONS_LIST(JSON.stringify(filters));

    return CacheService.wrap(cacheKey, async () => {
      const page = parseInt(filters.page as string || '1');
      const pageSize = parseInt(filters.pageSize as string || '20');
      const skip = (page - 1) * pageSize;

      const { data, total } = await this.repo.findSalons({
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

  async getSalonBySlug(slug: string) {
    return CacheService.wrap(CacheKeys.SALON_DETAIL(slug), async () => {
      const salon = await this.repo.findBySlug(slug, SalonQueryFragments.DETAIL_INCLUDE);

      if (!salon || salon.status !== AccountStatus.ACTIVE) {
        throw new ApiError(404, 'Salon not found');
      }

      return salon;
    }, 1800, { staleWhileRevalidate: 300 });
  }

  async createSalon(data: any, userId: bigint) {
    return withTx(async (tx) => {
      const salon = await this.repo.create({
        ...data,
        primaryOwnerId: userId,
        owners: { connect: { id: userId } },
        cityId: data.cityId ? BigInt(data.cityId) : undefined,
        neighborhoodId: data.neighborhoodId ? BigInt(data.neighborhoodId) : undefined,
        provinceId: data.provinceId ? BigInt(data.provinceId) : undefined,
        avatarMediaId: data.avatarMediaId ? BigInt(data.avatarMediaId) : undefined,
        coverMediaId: data.coverMediaId ? BigInt(data.coverMediaId) : undefined,
      }, tx);
      await initSeoMeta(EntityType.SALON, salon.id, salon.name, tx);
      // Invalidate lists and geo stats
      await CacheService.delByPattern(CacheKeys.SALONS_LIST_PATTERN);
      if (salon.cityId) await CacheService.del(CacheKeys.CITY_STATS(salon.cityId));
      return salon;
    });
  }

  private async checkOwnership(id: bigint, userId: bigint, isAdmin: boolean, tx?: any) {
    const salon = await this.repo.findUnique(id, { owners: { select: { id: true } } }, tx);
    if (!salon) throw new ApiError(404, 'Salon not found');

    const isOwner = (salon.owners as any[]).some((o: any) => o.id === userId);
    if (!isAdmin && !isOwner) {
      throw new ApiError(403, 'Forbidden');
    }
    return salon;
  }

  async updateSalon(id: bigint, data: any, userId: bigint, isAdmin: boolean) {
    return withTx(async (tx) => {
      const salon = await this.checkOwnership(id, userId, isAdmin, tx);

      if (data.slug && data.slug !== salon.slug) {
        await handleSlugChange(EntityType.SALON, id, salon.slug, data.slug, '/atlas/salon', tx);
      }

      const updatedSalon = await this.repo.update(id, {
        ...data,
        cityId: data.cityId ? BigInt(data.cityId) : undefined,
        neighborhoodId: data.neighborhoodId ? BigInt(data.neighborhoodId) : undefined,
        provinceId: data.provinceId ? BigInt(data.provinceId) : undefined,
        avatarMediaId: data.avatarMediaId ? BigInt(data.avatarMediaId) : undefined,
        coverMediaId: data.coverMediaId ? BigInt(data.coverMediaId) : undefined,
      }, tx);

      // Invalidate
      await CacheService.del(CacheKeys.SALON_DETAIL(salon.slug));
      await CacheService.delByPattern(CacheKeys.SALONS_LIST_PATTERN);
      return updatedSalon;
    });
  }

  async deleteSalon(id: bigint, userId: bigint, isAdmin: boolean) {
    await this.checkOwnership(id, userId, isAdmin);

    await this.repo.softDelete(id);
    return { ok: true };
  }

  async assignServices(id: bigint, serviceData: { serviceId: number; notes?: string }[], mode: 'append' | 'replace', userId: bigint, isAdmin: boolean) {
    return withTx(async (tx) => {
      await this.checkOwnership(id, userId, isAdmin, tx);

      if (mode === 'replace') {
        await this.repo.deleteServices(id, tx);
      }

      for (const item of serviceData) {
        await this.repo.upsertService(id, BigInt(item.serviceId), item.notes, tx);
      }
      return { ok: true };
    });
  }

  async removeService(id: bigint, serviceId: bigint, userId: bigint, isAdmin: boolean) {
    await this.checkOwnership(id, userId, isAdmin);

    await this.repo.deleteService(id, serviceId);
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
          entityType: EntityType.SALON,
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

    // Update media metadata to link it to this salon
    await this.mediaRepo.update(mediaId, {
      kind,
      entityType: EntityType.SALON,
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

  async linkArtist(salonId: bigint, data: any, userId: bigint, isAdmin: boolean) {
    await this.checkOwnership(salonId, userId, isAdmin);

    const salonArtist = await this.repo.upsertArtist(salonId, BigInt(data.artistId), {
      roleTitle: data.roleTitle,
      isActive: data.isActive ?? true,
      startedAt: data.startedAt ? new Date(data.startedAt) : undefined,
    });
    return salonArtist;
  }

  async unlinkArtist(salonId: bigint, artistId: bigint, userId: bigint, isAdmin: boolean) {
    await this.checkOwnership(salonId, userId, isAdmin);

    await this.repo.deleteArtist(salonId, artistId);
    return { ok: true };
  }
}
