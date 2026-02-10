import { prisma } from '../../shared/db/prisma';
import { ApiError } from '../../shared/errors/ApiError';
import { handleSlugChange } from '../../shared/utils/seo';
import { EntityType, AccountStatus } from '@prisma/client';
import { serialize } from '../../shared/utils/serialize';

export class SalonsService {
  async getSalons(filters: any) {
    const { province, city, neighborhood, service, verified, minRating, womenOnly, sort, page = 1, pageSize = 20 } = filters;
    const limit = parseInt(pageSize as string) || 20;
    const skip = (parseInt(page as string || '1') - 1) * limit;

    const where: any = {
      status: AccountStatus.ACTIVE,
    };

    if (province) where.city = { province: { slug: province } };
    if (city) where.city = { slug: city };
    if (neighborhood) where.neighborhood = { slug: neighborhood };
    if (service) where.services = { some: { service: { slug: service } } };
    if (verified === 'true') where.verification = 'VERIFIED';
    if (minRating) where.avgRating = { gte: parseFloat(minRating as string) };
    if (womenOnly === 'true') where.isWomenOnly = true;

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
      data: serialize(data),
      meta: { page: parseInt(page as string || '1'), pageSize: limit, total, totalPages: Math.ceil(total / limit) },
    };
  }

  async getSalonBySlug(slug: string) {
    const salon = await prisma.salon.findUnique({
      where: { slug },
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

    return serialize(salon);
  }

  async createSalon(data: any, userId: bigint) {
    const salon = await prisma.salon.create({
      data: {
        ...data,
        primaryOwnerId: userId,
        owners: { connect: { id: userId } },
        cityId: data.cityId ? BigInt(data.cityId) : undefined,
        neighborhoodId: data.neighborhoodId ? BigInt(data.neighborhoodId) : undefined,
        provinceId: data.provinceId ? BigInt(data.provinceId) : undefined,
      },
    });
    return serialize(salon);
  }

  async updateSalon(id: bigint, data: any, userId: bigint, isAdmin: boolean) {
    return prisma.$transaction(async (tx) => {
      const salon = await tx.salon.findUnique({
        where: { id },
        include: { owners: { select: { id: true } } },
      });
      if (!salon) throw new ApiError(404, 'Salon not found');

      const isOwner = salon.owners.some(o => o.id === userId);
      if (!isAdmin && !isOwner) {
        throw new ApiError(403, 'Forbidden');
      }

      if (data.slug && data.slug !== salon.slug) {
        await handleSlugChange(EntityType.SALON, id, salon.slug, data.slug, '/atlas/salon', tx);
      }

      const updatedSalon = await tx.salon.update({
        where: { id },
        data: {
          ...data,
          cityId: data.cityId ? BigInt(data.cityId) : undefined,
          neighborhoodId: data.neighborhoodId ? BigInt(data.neighborhoodId) : undefined,
          provinceId: data.provinceId ? BigInt(data.provinceId) : undefined,
        },
      });
      return serialize(updatedSalon);
    });
  }

  async deleteSalon(id: bigint, userId: bigint, isAdmin: boolean) {
    const salon = await prisma.salon.findUnique({
      where: { id },
      include: { owners: { select: { id: true } } },
    });
    if (!salon) throw new ApiError(404, 'Salon not found');

    const isOwner = salon.owners.some(o => o.id === userId);
    if (!isAdmin && !isOwner) {
      throw new ApiError(403, 'Forbidden');
    }

    await prisma.salon.update({
      where: { id },
      data: { status: AccountStatus.DELETED, deletedAt: new Date() },
    });
    return { ok: true };
  }

  async assignServices(id: bigint, serviceData: { serviceId: number; notes?: string }[], mode: 'append' | 'replace') {
    return prisma.$transaction(async (tx) => {
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

  async removeService(id: bigint, serviceId: bigint) {
    await prisma.salonService.delete({
      where: { salonId_serviceId: { salonId: id, serviceId } },
    });
    return { ok: true };
  }

  async attachMedia(id: bigint, mediaData: any, kind: 'AVATAR' | 'COVER' | 'GALLERY', userId: bigint) {
    const media = await prisma.media.create({
      data: {
        ...mediaData,
        uploadedBy: userId,
        kind,
        entityType: EntityType.SALON,
        entityId: id,
      },
    });

    if (kind === 'AVATAR') {
      await prisma.salon.update({ where: { id }, data: { avatarMediaId: media.id } });
    } else if (kind === 'COVER') {
      await prisma.salon.update({ where: { id }, data: { coverMediaId: media.id } });
    }

    return serialize(media);
  }

  async linkArtist(salonId: bigint, data: any) {
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
    return serialize(salonArtist);
  }

  async unlinkArtist(salonId: bigint, artistId: bigint) {
    await prisma.salonArtist.delete({
      where: { salonId_artistId: { salonId, artistId } },
    });
    return { ok: true };
  }
}
