import { prisma } from '../../shared/db/prisma';
import { TransactionClient } from '../../shared/db/tx';
import { AccountStatus, Prisma } from '@prisma/client';
import { SalonQueryFragments } from '../../shared/db/queryFragments';

export class SalonsRepository {
  private db(tx?: TransactionClient) {
    return tx || prisma;
  }

  async findSalons(params: {
    q?: string;
    province?: string;
    city?: string;
    neighborhood?: string;
    service?: string;
    verified?: string;
    minRating?: string;
    minReviewCount?: string;
    womenOnly?: string;
    priceTier?: string;
    sort?: string;
    skip: number;
    take: number;
  }, tx?: TransactionClient) {
    const { q, province, city, neighborhood, service, verified, minRating, womenOnly, priceTier, minReviewCount, sort, skip, take } = params;

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

    if (province) where.city = { province: { slug: province } };
    if (city) where.city = { slug: city };
    if (neighborhood) where.neighborhood = { slug: neighborhood };
    if (service) where.services = { some: { service: { slug: service } } };
    if (verified === 'true') where.verification = 'VERIFIED';
    if (minRating) where.avgRating = { gte: parseFloat(minRating as string) };
    if (minReviewCount) where.reviewCount = { gte: parseInt(minReviewCount as string) };
    if (womenOnly === 'true') where.isWomenOnly = true;
    if (priceTier) where.priceTier = parseInt(priceTier as string);

    let orderBy: Prisma.SalonOrderByWithRelationInput = { createdAt: 'desc' };
    if (sort === 'rating') orderBy = { avgRating: 'desc' };
    if (sort === 'popular') orderBy = { reviewCount: 'desc' };
    if (sort === 'new') orderBy = { createdAt: 'desc' };

    const [data, total] = await Promise.all([
      this.db(tx).salon.findMany({
        where,
        orderBy,
        skip,
        take,
        include: SalonQueryFragments.LIST_INCLUDE,
      }),
      this.db(tx).salon.count({ where }),
    ]);

    return { data, total };
  }

  async findUnique(id: bigint, include?: Prisma.SalonInclude, tx?: TransactionClient) {
    return (this.db(tx).salon.findUnique({
      where: { id },
      include,
    }) as any);
  }

  async findBySlug(slug: string, include?: Prisma.SalonInclude, tx?: TransactionClient) {
    return (this.db(tx).salon.findFirst({
      where: { slug, deletedAt: null },
      include,
    }) as any);
  }

  async create(data: Prisma.SalonUncheckedCreateInput, tx?: TransactionClient) {
    return this.db(tx).salon.create({ data });
  }

  async update(id: bigint, data: Prisma.SalonUncheckedUpdateInput, tx?: TransactionClient) {
    return this.db(tx).salon.update({
      where: { id },
      data,
    });
  }

  async softDelete(id: bigint, tx?: TransactionClient) {
    return this.db(tx).salon.update({
      where: { id },
      data: { status: AccountStatus.DELETED, deletedAt: new Date() },
    });
  }

  async upsertService(salonId: bigint, serviceId: bigint, notes?: string, tx?: TransactionClient) {
    return this.db(tx).salonService.upsert({
      where: {
        salonId_serviceId: { salonId, serviceId },
      },
      create: {
        salonId,
        serviceId,
        notes,
      },
      update: {
        notes,
      },
    });
  }

  async deleteServices(salonId: bigint, tx?: TransactionClient) {
    return this.db(tx).salonService.deleteMany({
      where: { salonId },
    });
  }

  async deleteService(salonId: bigint, serviceId: bigint, tx?: TransactionClient) {
    return this.db(tx).salonService.delete({
      where: { salonId_serviceId: { salonId, serviceId } },
    });
  }

  async upsertArtist(salonId: bigint, artistId: bigint, data: any, tx?: TransactionClient) {
    return this.db(tx).salonArtist.upsert({
      where: {
        salonId_artistId: { salonId, artistId },
      },
      create: {
        salonId,
        artistId,
        ...data,
      },
      update: data,
    });
  }

  async deleteArtist(salonId: bigint, artistId: bigint, tx?: TransactionClient) {
    return this.db(tx).salonArtist.delete({
      where: { salonId_artistId: { salonId, artistId } },
    });
  }
}

export const salonsRepository = new SalonsRepository();
