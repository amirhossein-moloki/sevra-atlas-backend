import { prisma } from '../../shared/db/prisma';
import { serialize } from '../../shared/utils/serialize';

export class GeoService {
  async getProvinces() {
    const provinces = await prisma.province.findMany({
      orderBy: { nameFa: 'asc' },
    });
    return serialize(provinces);
  }

  async getProvinceCities(slug: string) {
    const cities = await prisma.city.findMany({
      where: { province: { slug } },
      orderBy: { nameFa: 'asc' },
    });
    return serialize(cities);
  }

  async getCityBySlug(slug: string) {
    const city = await prisma.city.findFirst({
      where: { slug },
      include: { neighborhoods: true },
    });
    return serialize(city);
  }

  async getCityNeighborhoods(slug: string) {
    const neighborhoods = await prisma.neighborhood.findMany({
      where: { city: { slug } },
      orderBy: { nameFa: 'asc' },
    });
    return serialize(neighborhoods);
  }

  async createProvince(data: any) {
    const result = await prisma.province.create({ data: this.handleBigInts(data) });
    return serialize(result);
  }

  async createCity(data: any) {
    const result = await prisma.city.create({
      data: {
        ...this.handleBigInts(data),
        provinceId: BigInt(data.provinceId),
      },
    });
    return serialize(result);
  }

  async createNeighborhood(data: any) {
    const result = await prisma.neighborhood.create({
      data: {
        ...this.handleBigInts(data),
        cityId: BigInt(data.cityId),
      },
    });
    return serialize(result);
  }

  async updateCity(id: string, data: any) {
    const result = await prisma.city.update({
      where: { id: BigInt(id) },
      data: this.handleBigInts(data),
    });
    return serialize(result);
  }

  async updateNeighborhood(id: string, data: any) {
    const result = await prisma.neighborhood.update({
      where: { id: BigInt(id) },
      data: this.handleBigInts(data),
    });
    return serialize(result);
  }

  private handleBigInts(data: any) {
    const result = { ...data };
    if (result.provinceId) result.provinceId = BigInt(result.provinceId);
    if (result.cityId) result.cityId = BigInt(result.cityId);
    return result;
  }
}
