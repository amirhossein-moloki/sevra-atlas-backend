import { prisma } from '../../shared/db/prisma';
import { TransactionClient } from '../../shared/db/tx';
import { AccountStatus, Prisma } from '@prisma/client';
import { ArtistQueryFragments } from '../../shared/db/queryFragments';

export class ArtistsRepository {
  private db(tx?: TransactionClient) {
    return tx || prisma;
  }

  async findArtists(params: {
    q?: string;
    city?: string;
    neighborhood?: string;
    specialty?: string;
    verified?: string;
    minRating?: string;
    minReviewCount?: string;
    sort?: string;
    skip: number;
    take: number;
  }, tx?: TransactionClient) {
    const { q, city, neighborhood, specialty, verified, minRating, minReviewCount, sort, skip, take } = params;

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

    if (city) where.city = { slug: city };
    if (neighborhood) where.neighborhood = { slug: neighborhood };
    if (specialty) where.specialties = { some: { specialty: { slug: specialty } } };
    if (verified === 'true') where.verification = 'VERIFIED';
    if (minRating) where.avgRating = { gte: parseFloat(minRating as string) };
    if (minReviewCount) where.reviewCount = { gte: parseInt(minReviewCount as string) };

    let orderBy: Prisma.ArtistOrderByWithRelationInput = { createdAt: 'desc' };
    if (sort === 'rating') orderBy = { avgRating: 'desc' };
    if (sort === 'popular') orderBy = { reviewCount: 'desc' };
    if (sort === 'new') orderBy = { createdAt: 'desc' };

    const [data, total] = await Promise.all([
      this.db(tx).artist.findMany({
        where,
        orderBy,
        skip,
        take,
        include: ArtistQueryFragments.LIST_INCLUDE,
      }),
      this.db(tx).artist.count({ where }),
    ]);

    return { data, total };
  }

  async findUnique(id: bigint, include?: Prisma.ArtistInclude, tx?: TransactionClient) {
    return (this.db(tx).artist.findUnique({
      where: { id },
      include,
    }) as any);
  }

  async findFirst(where: Prisma.ArtistWhereInput, include?: Prisma.ArtistInclude, tx?: TransactionClient) {
    return (this.db(tx).artist.findFirst({
      where,
      include,
    }) as any);
  }

  async findBySlug(slug: string, include?: Prisma.ArtistInclude, tx?: TransactionClient) {
    return (this.db(tx).artist.findFirst({
      where: { slug, deletedAt: null },
      include,
    }) as any);
  }

  async create(data: Prisma.ArtistUncheckedCreateInput, tx?: TransactionClient) {
    return this.db(tx).artist.create({ data });
  }

  async update(id: bigint, data: Prisma.ArtistUncheckedUpdateInput, tx?: TransactionClient) {
    return this.db(tx).artist.update({
      where: { id },
      data,
    });
  }

  async softDelete(id: bigint, tx?: TransactionClient) {
    return this.db(tx).artist.update({
      where: { id },
      data: { status: AccountStatus.DELETED, deletedAt: new Date() },
    });
  }

  async createCertification(data: Prisma.ArtistCertificationUncheckedCreateInput, tx?: TransactionClient) {
    return this.db(tx).artistCertification.create({ data });
  }

  async findCertificationUnique(id: bigint, tx?: TransactionClient) {
    return this.db(tx).artistCertification.findUnique({ where: { id } });
  }

  async updateCertification(id: bigint, data: Prisma.ArtistCertificationUncheckedUpdateInput, tx?: TransactionClient) {
    return this.db(tx).artistCertification.update({
      where: { id },
      data,
    });
  }

  async deleteCertification(id: bigint, tx?: TransactionClient) {
    return this.db(tx).artistCertification.delete({ where: { id } });
  }

  async findSpecialties(tx?: TransactionClient) {
    return this.db(tx).specialty.findMany({
      where: { deletedAt: null },
      orderBy: { order: 'asc' }
    });
  }

  async createSpecialty(data: Prisma.SpecialtyCreateInput, tx?: TransactionClient) {
    return this.db(tx).specialty.create({ data });
  }

  async updateSpecialty(id: bigint, data: Prisma.SpecialtyUpdateInput, tx?: TransactionClient) {
    return this.db(tx).specialty.update({
      where: { id },
      data,
    });
  }

  async deleteSpecialty(id: bigint, tx?: TransactionClient) {
    return this.db(tx).specialty.update({
      where: { id },
      data: { deletedAt: new Date() }
    });
  }

  async deleteSpecialties(artistId: bigint, tx?: TransactionClient) {
    return this.db(tx).artistSpecialty.deleteMany({ where: { artistId } });
  }

  async upsertSpecialty(artistId: bigint, specialtyId: bigint, tx?: TransactionClient) {
    return this.db(tx).artistSpecialty.upsert({
      where: {
        artistId_specialtyId: { artistId, specialtyId },
      },
      create: {
        artistId,
        specialtyId,
      },
      update: {},
    });
  }
}

export const artistsRepository = new ArtistsRepository();
