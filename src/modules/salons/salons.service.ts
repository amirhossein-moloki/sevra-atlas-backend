import { prisma } from '../../shared/db/prisma';
import { ApiError } from '../../shared/errors/ApiError';
import { handleSlugChange } from '../../shared/utils/seo';
import { EntityType, AccountStatus } from '@prisma/client';

export class SalonsService {
  async getSalons(filters: any) {
    const { city, neighborhood, service, sort, page = 1, limit = 10 } = filters;
    
    const where: any = {
      status: AccountStatus.ACTIVE,
    };

    if (city) where.city = { slug: city };
    if (neighborhood) where.neighborhood = { slug: neighborhood };
    if (service) where.services = { some: { service: { slug: service } } };

    let orderBy: any = { createdAt: 'desc' };
    if (sort === 'rating') orderBy = { avgRating: 'desc' };
    if (sort === 'popular') orderBy = { reviewCount: 'desc' };

    const [data, total] = await Promise.all([
      prisma.salon.findMany({
        where,
        orderBy,
        skip: (page - 1) * limit,
        take: limit,
        include: { avatar: true, city: true, neighborhood: true },
      }),
      prisma.salon.count({ where }),
    ]);

    return { data, total };
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
      },
    });

    if (!salon || salon.status !== AccountStatus.ACTIVE) {
      throw new ApiError(404, 'Salon not found');
    }

    return salon;
  }

  async createSalon(data: any, userId: bigint) {
    return prisma.salon.create({
      data: {
        ...data,
        primaryOwnerId: userId,
        owners: { connect: { id: userId } },
        cityId: data.cityId ? BigInt(data.cityId) : undefined,
        neighborhoodId: data.neighborhoodId ? BigInt(data.neighborhoodId) : undefined,
      },
    });
  }

  async updateSalon(id: bigint, data: any, userId: bigint, isAdmin: boolean) {
    const salon = await prisma.salon.findUnique({ where: { id } });
    if (!salon) throw new ApiError(404, 'Salon not found');

    if (!isAdmin && salon.primaryOwnerId !== userId) {
      throw new ApiError(403, 'Forbidden');
    }

    if (data.slug && data.slug !== salon.slug) {
      await handleSlugChange(EntityType.SALON, id, salon.slug, data.slug, '/salon');
    }

    return prisma.salon.update({
      where: { id },
      data,
    });
  }
}
