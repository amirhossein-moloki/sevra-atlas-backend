import { prisma } from '../../shared/db/prisma';
import { handleSlugChange } from '../../shared/utils/seo';
import { EntityType } from '@prisma/client';
import { ApiError } from '../../shared/errors/ApiError';

export class GeoService {
  async getProvinces() {
    const provinces = await prisma.province.findMany({
      orderBy: { nameFa: 'asc' },
    });
    return provinces;
  }

  async getProvinceCities(slug: string) {
    const cities = await prisma.city.findMany({
      where: { province: { slug } },
      orderBy: { nameFa: 'asc' },
    });
    return cities;
  }

  async getCityBySlug(slug: string) {
    const city = await prisma.city.findFirst({
      where: { slug },
      include: { neighborhoods: true, cityStats: true },
    });
    return city;
  }

  async refreshCityStats(cityId: bigint) {
    const [salonCount, artistCount, aggregation] = await Promise.all([
      prisma.salon.count({ where: { cityId, status: 'ACTIVE' } }),
      prisma.artist.count({ where: { cityId, status: 'ACTIVE' } }),
      prisma.salon.aggregate({
        where: { cityId, status: 'ACTIVE' },
        _avg: { avgRating: true }
      })
    ]);

    await prisma.cityStats.upsert({
      where: { cityId },
      update: {
        salonCount,
        artistCount,
        avgRating: aggregation._avg.avgRating || 0,
      },
      create: {
        cityId,
        salonCount,
        artistCount,
        avgRating: aggregation._avg.avgRating || 0,
      }
    });
  }

  async getCityNeighborhoods(slug: string) {
    const neighborhoods = await prisma.neighborhood.findMany({
      where: { city: { slug } },
      orderBy: { nameFa: 'asc' },
    });
    return neighborhoods;
  }

  async createProvince(data: Record<string, unknown>) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const result = await prisma.province.create({ data: this.handleBigInts(data) as any });
    return result;
  }

  async createCity(data: Record<string, unknown>) {
    const result = await prisma.city.create({
      data: {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        ...this.handleBigInts(data) as any,
        provinceId: BigInt(data.provinceId as string | number | bigint),
      },
    });
    return result;
  }

  async createNeighborhood(data: Record<string, unknown>) {
    const result = await prisma.neighborhood.create({
      data: {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        ...this.handleBigInts(data) as any,
        cityId: BigInt(data.cityId as string | number | bigint),
      },
    });
    return result;
  }

  async updateCity(id: string, data: Record<string, unknown>) {
    const cityId = BigInt(id);
    return prisma.$transaction(async (tx) => {
      const city = await tx.city.findUnique({ where: { id: cityId } });
      if (!city) throw new ApiError(404, 'City not found');

      if (data.slug && data.slug !== city.slug) {
        await handleSlugChange(EntityType.CITY, cityId, city.slug, data.slug as string, '/atlas/city', tx);
      }

      const result = await tx.city.update({
        where: { id: cityId },
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        data: this.handleBigInts(data) as any,
      });
      return result;
    });
  }

  async updateProvince(id: string, data: Record<string, unknown>) {
    const provinceId = BigInt(id);
    return prisma.$transaction(async (tx) => {
      const province = await tx.province.findUnique({ where: { id: provinceId } });
      if (!province) throw new ApiError(404, 'Province not found');

      if (data.slug && data.slug !== province.slug) {
        await handleSlugChange(EntityType.PROVINCE, provinceId, province.slug, data.slug as string, '/atlas/province', tx);
      }

      const result = await tx.province.update({
        where: { id: provinceId },
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        data: this.handleBigInts(data) as any,
      });
      return result;
    });
  }

  async updateNeighborhood(id: string, data: Record<string, unknown>) {
    const result = await prisma.neighborhood.update({
      where: { id: BigInt(id) },
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      data: this.handleBigInts(data) as any,
    });
    return result;
  }

  private handleBigInts(data: Record<string, unknown>) {
    const result = { ...data } as Record<string, unknown>;
    if (result.provinceId) result.provinceId = BigInt(result.provinceId as string | number | bigint);
    if (result.cityId) result.cityId = BigInt(result.cityId as string | number | bigint);
    return result;
  }
}
