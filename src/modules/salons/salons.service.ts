import { prisma } from '../../shared/db/prisma';
import { ApiError } from '../../shared/errors/ApiError';
import { handleSlugChange, initSeoMeta } from '../../shared/utils/seo';
import { EntityType, AccountStatus } from '@prisma/client';
import { CacheService } from '../../shared/redis/cache.service';
import { CacheKeys } from '../../shared/redis/cache-keys';

export class SalonsService {
  async getSalons(filters: any) {
    const cacheKey = CacheKeys.SALONS_LIST(JSON.stringify(filters));

    return CacheService.wrap(cacheKey, async () => {
      const { q, province, city, neighborhood, service, verified, minRating, womenOnly, priceTier, minReviewCount, sort, page = 1, pageSize = 20 } = filters;
    const limit = parseInt(pageSize as string) || 20;
    const skip = (parseInt(page as string || '1') - 1) * limit;

    const where: any = {
      status: AccountStatus.ACTIVE,
      deletedAt: null,
    };

    if (q) {
      where.OR = [
        { name: { contains: q as string, mode: 'insensitive' } },
        { description: { contains: q as string, mode: 'insensitive' } },
        { summary: { contains: q as string, mode: 'insensitive' } },
      ];
    }

    if (province) where.city = { province: { slug: province } };
    if (city) where.city = { slug: city };
    if (neighborhood) where.neighborhood = { slug: neighborhood };
    if (service) where.services = { some: { service: { slug: service } } };
    if (verified === 'true') where.verification = 'VERIFIED';
    if (minRating) where.avgRating = { gte: parseFloat(minRating as string) };
    if (minReviewCount) where.reviewCount = { gte: parseInt(minReviewCount as string) };
    if (womenOnly === 'true') where.isWomenOnly = true;
    if (priceTier) where.priceTier = parseInt(priceTier as string);

    let orderBy: any = { createdAt: 'desc' };
    if (sort === 'rating') orderBy = { avgRating: 'desc' };
    if (sort === 'popular') orderBy = { reviewCount: 'desc' };
    if (sort === 'new') orderBy = { createdAt: 'desc' };

    const [data, total] = await Promise.all([
      prisma.salon.findMany({
        where,
        orderBy,
        skip,
        take: limit,
        include: { avatar: true, city: true, neighborhood: true },
      }),
      prisma.salon.count({ where }),
    ]);

      return {
        data: data,
        meta: { page: parseInt(page as string || '1'), pageSize: limit, total, totalPages: Math.ceil(total / limit) },
      };
    }, 300, { staleWhileRevalidate: 60 });
  }

  async getSalonBySlug(slug: string) {
    return CacheService.wrap(CacheKeys.SALON_DETAIL(slug), async () => {
      const salon = await prisma.salon.findFirst({
      where: { slug, deletedAt: null },
      include: {
        avatar: true,
        cover: true,
        city: true,
        neighborhood: true,
        services: { include: { service: true } },
        salonArtists: { include: { artist: true } },
        seoMeta: true,
      },
    });

      if (!salon || salon.status !== AccountStatus.ACTIVE) {
        throw new ApiError(404, 'Salon not found');
      }

      return salon;
    }, 1800, { staleWhileRevalidate: 300 });
  }

  async createSalon(data: any, userId: bigint) {
    return prisma.$transaction(async (tx) => {
      const salon = await tx.salon.create({
        data: {
          name: data.name,
          slug: data.slug,
          summary: data.summary,
          description: data.description,
          phone: data.phone,
          instagram: data.instagram,
          website: data.website,
          addressLine: data.addressLine,
          postalCode: data.postalCode,
          lat: data.lat,
          lng: data.lng,
          isWomenOnly: data.isWomenOnly,
          priceTier: data.priceTier,
          primaryOwnerId: userId,
          owners: { connect: { id: userId } },
          cityId: data.cityId ? BigInt(data.cityId) : undefined,
          neighborhoodId: data.neighborhoodId ? BigInt(data.neighborhoodId) : undefined,
          provinceId: data.provinceId ? BigInt(data.provinceId) : undefined,
          avatarMediaId: data.avatarMediaId ? BigInt(data.avatarMediaId) : undefined,
          coverMediaId: data.coverMediaId ? BigInt(data.coverMediaId) : undefined,
        },
      });
      await initSeoMeta(EntityType.SALON, salon.id, salon.name, tx);
      // Invalidate lists and geo stats
      await CacheService.delByPattern(CacheKeys.SALONS_LIST_PATTERN);
      if (salon.cityId) await CacheService.del(CacheKeys.CITY_STATS(salon.cityId));
      return salon;
    });
  }

  private async checkOwnership(tx: any, id: bigint, userId: bigint, isAdmin: boolean) {
    const salon = await tx.salon.findUnique({
      where: { id },
      include: { owners: { select: { id: true } } },
    });
    if (!salon) throw new ApiError(404, 'Salon not found');

    const isOwner = salon.owners.some((o: any) => o.id === userId);
    if (!isAdmin && !isOwner) {
      throw new ApiError(403, 'Forbidden');
    }
    return salon;
  }

  async updateSalon(id: bigint, data: any, userId: bigint, isAdmin: boolean) {
    return prisma.$transaction(async (tx) => {
      const salon = await this.checkOwnership(tx, id, userId, isAdmin);

      if (data.slug && data.slug !== salon.slug) {
        await handleSlugChange(EntityType.SALON, id, salon.slug, data.slug, '/atlas/salon', tx);
      }

      const updatedSalon = await tx.salon.update({
        where: { id },
        data: {
          name: data.name,
          slug: data.slug,
          summary: data.summary,
          description: data.description,
          phone: data.phone,
          instagram: data.instagram,
          website: data.website,
          addressLine: data.addressLine,
          postalCode: data.postalCode,
          lat: data.lat,
          lng: data.lng,
          isWomenOnly: data.isWomenOnly,
          priceTier: data.priceTier,
          cityId: data.cityId ? BigInt(data.cityId) : undefined,
          neighborhoodId: data.neighborhoodId ? BigInt(data.neighborhoodId) : undefined,
          provinceId: data.provinceId ? BigInt(data.provinceId) : undefined,
          avatarMediaId: data.avatarMediaId ? BigInt(data.avatarMediaId) : undefined,
          coverMediaId: data.coverMediaId ? BigInt(data.coverMediaId) : undefined,
        },
      });

      // Invalidate
      await CacheService.del(CacheKeys.SALON_DETAIL(salon.slug));
      await CacheService.delByPattern(CacheKeys.SALONS_LIST_PATTERN);
      return updatedSalon;
    });
  }

  async deleteSalon(id: bigint, userId: bigint, isAdmin: boolean) {
    await this.checkOwnership(prisma, id, userId, isAdmin);

    await prisma.salon.update({
      where: { id },
      data: { status: AccountStatus.DELETED, deletedAt: new Date() },
    });
    return { ok: true };
  }

  async assignServices(id: bigint, serviceData: { serviceId: number; notes?: string }[], mode: 'append' | 'replace', userId: bigint, isAdmin: boolean) {
    return prisma.$transaction(async (tx) => {
      await this.checkOwnership(tx, id, userId, isAdmin);

      if (mode === 'replace') {
        await tx.salonService.deleteMany({ where: { salonId: id } });
      }

      for (const item of serviceData) {
        await tx.salonService.upsert({
          where: {
            salonId_serviceId: { salonId: id, serviceId: BigInt(item.serviceId) },
          },
          create: {
            salonId: id,
            serviceId: BigInt(item.serviceId),
            notes: item.notes,
          },
          update: {
            notes: item.notes,
          },
        });
      }
      return { ok: true };
    });
  }

  async removeService(id: bigint, serviceId: bigint, userId: bigint, isAdmin: boolean) {
    await this.checkOwnership(prisma, id, userId, isAdmin);

    await prisma.salonService.delete({
      where: { salonId_serviceId: { salonId: id, serviceId } },
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
            entityType: EntityType.SALON,
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

    // Update media metadata to link it to this salon
    await prisma.media.update({
      where: { id: mediaId },
      data: {
        kind,
        entityType: EntityType.SALON,
        entityId: id,
      },
    });

    if (kind === 'AVATAR') {
      await prisma.salon.update({ where: { id }, data: { avatarMediaId: mediaId } });
    } else if (kind === 'COVER') {
      await prisma.salon.update({ where: { id }, data: { coverMediaId: mediaId } });
    }

    const finalMedia = await prisma.media.findUnique({ where: { id: mediaId } });
    return finalMedia;
  }

  async linkArtist(salonId: bigint, data: any, userId: bigint, isAdmin: boolean) {
    await this.checkOwnership(prisma, salonId, userId, isAdmin);

    const salonArtist = await prisma.salonArtist.upsert({
      where: {
        salonId_artistId: { salonId, artistId: BigInt(data.artistId) },
      },
      create: {
        salonId,
        artistId: BigInt(data.artistId),
        roleTitle: data.roleTitle,
        isActive: data.isActive ?? true,
        startedAt: data.startedAt ? new Date(data.startedAt) : undefined,
      },
      update: {
        roleTitle: data.roleTitle,
        isActive: data.isActive,
        startedAt: data.startedAt ? new Date(data.startedAt) : undefined,
      },
    });
    return salonArtist;
  }

  async unlinkArtist(salonId: bigint, artistId: bigint, userId: bigint, isAdmin: boolean) {
    await this.checkOwnership(prisma, salonId, userId, isAdmin);

    await prisma.salonArtist.delete({
      where: { salonId_artistId: { salonId, artistId } },
    });
    return { ok: true };
  }
}
