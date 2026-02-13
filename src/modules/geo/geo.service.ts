import { handleSlugChange } from '../../shared/utils/seo';
import { EntityType } from '@prisma/client';
import { ApiError } from '../../shared/errors/ApiError';
import { geoRepository, GeoRepository } from './geo.repository';
import { withTx } from '../../shared/db/tx';

export class GeoService {
  constructor(
    private readonly repo: GeoRepository = geoRepository
  ) {}

  async getProvinces() {
    return this.repo.findProvinces({
      orderBy: { nameFa: 'asc' },
    });
  }

  async getProvinceCities(slug: string) {
    return this.repo.findCities({
      where: { province: { slug } },
      orderBy: { nameFa: 'asc' },
    });
  }

  async getCityBySlug(slug: string) {
    return this.repo.findCityFirst({ slug }, { neighborhoods: true, cityStats: true });
  }

  async refreshCityStats(cityId: bigint) {
    const [salonCount, artistCount, aggregation] = await Promise.all([
      this.repo.countSalons({ cityId, status: 'ACTIVE' }),
      this.repo.countArtists({ cityId, status: 'ACTIVE' }),
      this.repo.aggregateSalons({
        where: { cityId, status: 'ACTIVE' },
        _avg: { avgRating: true }
      })
    ]);

    await this.repo.upsertCityStats(cityId, {
      salonCount,
      artistCount,
      avgRating: (aggregation as any)._avg.avgRating || 0,
    });
  }

  async getCityNeighborhoods(slug: string) {
    return this.repo.findNeighborhoods({
      where: { city: { slug } },
      orderBy: { nameFa: 'asc' },
    });
  }

  async createProvince(data: any) {
    return this.repo.createProvince(this.handleBigInts(data));
  }

  async createCity(data: any) {
    return this.repo.createCity({
      ...this.handleBigInts(data),
      provinceId: BigInt(data.provinceId),
    });
  }

  async createNeighborhood(data: any) {
    return this.repo.createNeighborhood({
      ...this.handleBigInts(data),
      cityId: BigInt(data.cityId),
    });
  }

  async updateCity(id: string, data: any) {
    const cityId = BigInt(id);
    return withTx(async (tx) => {
      const city = await this.repo.findCityUnique(cityId, tx);
      if (!city) throw new ApiError(404, 'City not found');

      if (data.slug && data.slug !== city.slug) {
        await handleSlugChange(EntityType.CITY, cityId, city.slug, data.slug, '/atlas/city', tx);
      }

      return this.repo.updateCity(cityId, this.handleBigInts(data), tx);
    });
  }

  async updateProvince(id: string, data: any) {
    const provinceId = BigInt(id);
    return withTx(async (tx) => {
      const province = await this.repo.findProvinceUnique(provinceId, tx);
      if (!province) throw new ApiError(404, 'Province not found');

      if (data.slug && data.slug !== province.slug) {
        await handleSlugChange(EntityType.PROVINCE, provinceId, province.slug, data.slug, '/atlas/province', tx);
      }

      return this.repo.updateProvince(provinceId, this.handleBigInts(data), tx);
    });
  }

  async updateNeighborhood(id: string, data: any) {
    return this.repo.updateNeighborhood(BigInt(id), this.handleBigInts(data));
  }

  private handleBigInts(data: any) {
    const result = { ...data };
    if (result.provinceId) result.provinceId = BigInt(result.provinceId);
    if (result.cityId) result.cityId = BigInt(result.cityId);
    return result;
  }
}
