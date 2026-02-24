import { prisma } from '../../shared/db/prisma';
import { ApiError } from '../../shared/errors/ApiError';
import { handleSlugChange, initSeoMeta } from '../../shared/utils/seo';
import { EntityType, AccountStatus, Prisma } from '@prisma/client';
import { CacheService } from '../../shared/redis/cache.service';
import { CacheKeys } from '../../shared/redis/cache-keys';
import { pickAllowedFields } from '../../shared/utils/object';
import { safeBigInt } from '../../shared/utils/bigint';

export class SalonsService {
  private readonly allowedFields = [
    'name', 'slug', 'summary', 'description', 'phone', 'instagram', 'website',
    'addressLine', 'postalCode', 'lat', 'lng', 'isWomenOnly', 'priceTier',
    'cityId', 'neighborhoodId', 'provinceId', 'avatarMediaId', 'coverMediaId'
  ] as const;

  private readonly publicSalonFields = {
    id: true,
    name: true,
    slug: true,
    summary: true,
    description: true,
    phone: true,
    instagram: true,
    website: true,
    addressLine: true,
    postalCode: true,
    lat: true,
    lng: true,
    isWomenOnly: true,
    priceTier: true,
    avgRating: true,
    reviewCount: true,
    verification: true,
    status: true,
    cityId: true,
    neighborhoodId: true,
    provinceId: true,
    avatarMediaId: true,
    coverMediaId: true,
    seoMetaId: true,
    planId: true,
    subscriptionStatus: true,
    featuredUntil: true,
    createdAt: true,
    updatedAt: true,
  };

  async getSalons(filters: Record<string, unknown>) {
    const cacheKey = CacheKeys.SALONS_LIST(JSON.stringify(filters));

    return CacheService.wrap(cacheKey, async () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { q, province, city, neighborhood, service, verified, minRating, womenOnly, priceTier, minReviewCount, sort, page = 1, pageSize = 20 } = filters as any;
    const limit = parseInt(pageSize as string) || 20;
    const skip = (parseInt(page as string || '1') - 1) * limit;

    const where: Prisma.SalonWhereInput = {
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

    if (province) where.city = { province: { slug: province as string } };
    if (city) where.city = { ...((where.city as object) || {}), slug: city as string };
    if (neighborhood) where.neighborhood = { slug: neighborhood as string };
    if (service) where.services = { some: { service: { slug: service as string } } };
    if (verified === 'true') where.verification = 'VERIFIED';
    if (minRating) where.avgRating = { gte: parseFloat(minRating as string) };
    if (minReviewCount) where.reviewCount = { gte: parseInt(minReviewCount as string) };
    if (womenOnly === 'true') where.isWomenOnly = true;
    if (priceTier) where.priceTier = parseInt(priceTier as string);

    let orderBy: Prisma.SalonOrderByWithRelationInput = { visibilityScore: 'desc' };
    if (sort === 'rating') orderBy = { avgRating: 'desc' };
    if (sort === 'popular') orderBy = { reviewCount: 'desc' };
    if (sort === 'new') orderBy = { createdAt: 'desc' };

    const [data, total] = await Promise.all([
      prisma.salon.findMany({
        where,
        select: {
          ...this.publicSalonFields,
          avatar: true,
          city: true,
          neighborhood: true,
          plan: true,
        },
        orderBy,
        skip,
        take: limit,
      }),
      prisma.salon.count({ where }),
    ]);

      return {
        data: data || [],
        meta: {
          page: parseInt(page as string || '1'),
          pageSize: limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
      };
    }, 300, { staleWhileRevalidate: 60 });
  }

  async findSalonByIdentifier(identifier: string) {
    const where: Prisma.SalonWhereInput = { deletedAt: null };
    if (/^\d+$/.test(identifier) && identifier.length < 20) {
      where.id = safeBigInt(identifier, 'salon_id');
    } else {
      where.slug = identifier;
    }
    return prisma.salon.findFirst({ where });
  }

  async getSalonByIdentifier(identifier: string) {
    return CacheService.wrap(CacheKeys.SALON_DETAIL(identifier), async () => {
      const where: Prisma.SalonWhereInput = { deletedAt: null };
      if (/^\d+$/.test(identifier) && identifier.length < 20) {
        where.id = safeBigInt(identifier, 'salon_id');
      } else {
        where.slug = identifier;
      }

      const salon = await prisma.salon.findFirst({
      where,
      select: {
        ...this.publicSalonFields,
        avatar: true,
        cover: true,
        city: true,
        neighborhood: true,
        services: { include: { service: true } },
        salonArtists: { include: { artist: true } },
        seoMeta: true,
        openingHours: true,
      },
    });

      if (!salon || salon.status !== AccountStatus.ACTIVE) {
        throw new ApiError(404, 'Salon not found');
      }

      return salon;
    }, 1800, { staleWhileRevalidate: 300 });
  }

  async createSalon(data: Record<string, unknown>, userId: bigint) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const safeData = pickAllowedFields(data, [...this.allowedFields]) as any;

    return prisma.$transaction(async (tx) => {
      const salon = await tx.salon.create({
        data: {
          ...safeData,
          cityId: safeData.cityId ? safeBigInt(safeData.cityId, 'cityId') : undefined,
          neighborhoodId: safeData.neighborhoodId ? safeBigInt(safeData.neighborhoodId, 'neighborhoodId') : undefined,
          provinceId: safeData.provinceId ? safeBigInt(safeData.provinceId, 'provinceId') : undefined,
          avatarMediaId: safeData.avatarMediaId ? safeBigInt(safeData.avatarMediaId, 'avatarMediaId') : undefined,
          coverMediaId: safeData.coverMediaId ? safeBigInt(safeData.coverMediaId, 'coverMediaId') : undefined,
          primaryOwnerId: userId,
          owners: { connect: { id: userId } },
        },
        select: this.publicSalonFields,
      });
      await initSeoMeta(EntityType.SALON, salon.id, salon.name, tx);
      // Invalidate lists and geo stats
      await CacheService.delByPattern(CacheKeys.SALONS_LIST_PATTERN);
      if (salon.cityId) await CacheService.del(CacheKeys.CITY_STATS(salon.cityId));
      return salon;
    });
  }

  private async checkOwnership(tx: Prisma.TransactionClient | typeof prisma, id: bigint, userId: bigint, isAdmin: boolean) {
    const salon = await tx.salon.findUnique({
      where: { id },
      include: { owners: { select: { id: true } } },
    });
    if (!salon) throw new ApiError(404, 'Salon not found');

    const isOwner = salon.owners.some((o: { id: bigint }) => o.id === userId);
    if (!isAdmin && !isOwner) {
      throw new ApiError(403, 'Forbidden');
    }
    return salon;
  }

  async updateSalon(id: bigint, data: Record<string, unknown>, userId: bigint, isAdmin: boolean) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const safeData = pickAllowedFields(data, [...this.allowedFields]) as any;

    return prisma.$transaction(async (tx) => {
      const salon = await this.checkOwnership(tx, id, userId, isAdmin);

      if (safeData.slug && safeData.slug !== salon.slug) {
        await handleSlugChange(EntityType.SALON, id, salon.slug, safeData.slug as string, '/atlas/salon', tx);
      }

      const updatedSalon = await tx.salon.update({
        where: { id },
        data: {
          ...safeData,
          cityId: safeData.cityId ? safeBigInt(safeData.cityId, 'cityId') : undefined,
          neighborhoodId: safeData.neighborhoodId ? safeBigInt(safeData.neighborhoodId, 'neighborhoodId') : undefined,
          provinceId: safeData.provinceId ? safeBigInt(safeData.provinceId, 'provinceId') : undefined,
          avatarMediaId: safeData.avatarMediaId ? safeBigInt(safeData.avatarMediaId, 'avatarMediaId') : undefined,
          coverMediaId: safeData.coverMediaId ? safeBigInt(safeData.coverMediaId, 'coverMediaId') : undefined,
        },
        select: this.publicSalonFields,
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

  async assignServices(
    id: bigint,
    serviceData: {
      serviceId: string;
      priceToman?: string;
      durationMin?: number;
      isActive?: boolean;
      notes?: string;
      order?: number;
    }[],
    mode: 'append' | 'replace',
    userId: bigint,
    isAdmin: boolean
  ) {
    return prisma.$transaction(async (tx) => {
      await this.checkOwnership(tx, id, userId, isAdmin);

      if (mode === 'replace') {
        await tx.salonService.deleteMany({ where: { salonId: id } });
      }

      const dataToUpsert = serviceData.map(item => ({
        salonId: id,
        serviceId: safeBigInt(item.serviceId, 'serviceId'),
        priceToman: item.priceToman ? BigInt(item.priceToman) : null,
        durationMin: item.durationMin,
        isActive: item.isActive ?? true,
        notes: item.notes,
        order: item.order ?? 0,
      }));

      if (mode === 'replace') {
        await tx.salonService.createMany({
          data: dataToUpsert,
          skipDuplicates: true,
        });
      } else {
        const existing = await tx.salonService.findMany({
          where: {
            salonId: id,
            serviceId: { in: dataToUpsert.map(d => d.serviceId) },
          },
        });
        const existingMap = new Map(existing.map(e => [e.serviceId, e]));

        const toCreate = dataToUpsert.filter(d => !existingMap.has(d.serviceId));
        const toUpdate = dataToUpsert.filter(d => existingMap.has(d.serviceId));

        if (toCreate.length > 0) {
          await tx.salonService.createMany({ data: toCreate });
        }
        for (const item of toUpdate) {
          await tx.salonService.update({
            where: {
              salonId_serviceId: { salonId: id, serviceId: item.serviceId },
            },
            data: {
              priceToman: item.priceToman,
              durationMin: item.durationMin,
              isActive: item.isActive,
              notes: item.notes,
              order: item.order,
            },
          });
        }
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
          entityType: EntityType.SALON,
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

  async linkArtist(salonId: bigint, data: Record<string, unknown>, userId: bigint, isAdmin: boolean) {
    await this.checkOwnership(prisma, salonId, userId, isAdmin);
    const artistId = safeBigInt(data.artistId, 'artistId');

    const salonArtist = await prisma.salonArtist.upsert({
      where: {
        salonId_artistId: { salonId, artistId },
      },
      create: {
        salonId,
        artistId,
        roleTitle: data.roleTitle as string,
        isActive: (data.isActive as boolean) ?? true,
        startedAt: data.startedAt ? new Date(data.startedAt as string) : undefined,
      },
      update: {
        roleTitle: data.roleTitle as string,
        isActive: data.isActive as boolean,
        startedAt: data.startedAt ? new Date(data.startedAt as string) : undefined,
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

  async getSalonArtists(id: bigint) {
    const salonArtists = await prisma.salonArtist.findMany({
      where: { salonId: id },
      include: {
        artist: {
          select: {
            id: true,
            fullName: true,
            slug: true,
            summary: true,
            avgRating: true,
            reviewCount: true,
            verification: true,
            status: true,
            avatar: true,
            city: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return salonArtists.map(sa => ({
      artist: sa.artist,
      roleTitle: sa.roleTitle,
      isActive: sa.isActive,
    }));
  }

  async getSalonServices(id: bigint) {
    const salonServices = await prisma.salonService.findMany({
      where: { salonId: id },
      include: {
        service: {
          include: { category: true },
        },
      },
      orderBy: [{ order: 'asc' }, { service: { category: { order: 'asc' } } }],
    });

    // Group by category
    const grouped = new Map<string, any>();

    for (const ss of salonServices) {
      const category = ss.service.category;
      if (!grouped.has(category.id.toString())) {
        grouped.set(category.id.toString(), {
          category: {
            id: category.id.toString(),
            nameFa: category.nameFa,
            slug: category.slug,
          },
          services: [],
        });
      }
      grouped.get(category.id.toString()).services.push({
        serviceId: ss.serviceId.toString(),
        nameFa: ss.service.nameFa,
        slug: ss.service.slug,
        priceToman: ss.priceToman ? ss.priceToman.toString() : null,
        durationMin: ss.durationMin,
        isActive: ss.isActive,
        notes: ss.notes,
      });
    }

    return Array.from(grouped.values());
  }

  async getGallery(id: bigint, page: number, pageSize: number) {
    const limit = pageSize;
    const skip = (page - 1) * limit;

    const [items, total] = await Promise.all([
      prisma.media.findMany({
        where: {
          entityType: EntityType.SALON,
          entityId: id,
          kind: 'GALLERY',
          deletedAt: null,
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.media.count({
        where: {
          entityType: EntityType.SALON,
          entityId: id,
          kind: 'GALLERY',
          deletedAt: null,
        },
      }),
    ]);

    return {
      items,
      page,
      limit,
      total,
    };
  }
}
