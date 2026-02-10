import { prisma } from '../../shared/db/prisma';

export class GeoService {
  async getProvinces() {
    return prisma.province.findMany({
      orderBy: { nameFa: 'asc' },
    });
  }

  async getProvinceCities(slug: string) {
    return prisma.city.findMany({
      where: { province: { slug } },
      orderBy: { nameFa: 'asc' },
    });
  }

  async getCity(id: bigint) {
    return prisma.city.findUnique({
      where: { id },
      include: { neighborhoods: true },
    });
  }

  async createProvince(data: any) {
    return prisma.province.create({ data });
  }

  async createCity(data: any) {
    return prisma.city.create({
      data: {
        ...data,
        provinceId: BigInt(data.provinceId),
      },
    });
  }

  async createNeighborhood(data: any) {
    return prisma.neighborhood.create({
      data: {
        ...data,
        cityId: BigInt(data.cityId),
      },
    });
  }
}
