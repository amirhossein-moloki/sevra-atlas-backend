import { prisma } from '../../shared/db/prisma';
import { TransactionClient } from '../../shared/db/tx';
import { Prisma } from '@prisma/client';

export class GeoRepository {
  private db(tx?: TransactionClient) {
    return tx || prisma;
  }

  async findProvinces(params: Prisma.ProvinceFindManyArgs, tx?: TransactionClient) {
    return this.db(tx).province.findMany(params);
  }

  async findProvinceUnique(id: bigint, tx?: TransactionClient) {
    return this.db(tx).province.findUnique({ where: { id } });
  }

  async createProvince(data: Prisma.ProvinceUncheckedCreateInput, tx?: TransactionClient) {
    return this.db(tx).province.create({ data });
  }

  async updateProvince(id: bigint, data: Prisma.ProvinceUncheckedUpdateInput, tx?: TransactionClient) {
    return this.db(tx).province.update({ where: { id }, data });
  }

  async findCities(params: Prisma.CityFindManyArgs, tx?: TransactionClient) {
    return this.db(tx).city.findMany(params);
  }

  async findCityUnique(id: bigint, tx?: TransactionClient) {
    return this.db(tx).city.findUnique({ where: { id } });
  }

  async findCityFirst(where: Prisma.CityWhereInput, include?: Prisma.CityInclude, tx?: TransactionClient) {
    return (this.db(tx).city.findFirst({ where, include }) as any);
  }

  async createCity(data: Prisma.CityUncheckedCreateInput, tx?: TransactionClient) {
    return this.db(tx).city.create({ data });
  }

  async updateCity(id: bigint, data: Prisma.CityUncheckedUpdateInput, tx?: TransactionClient) {
    return this.db(tx).city.update({ where: { id }, data });
  }

  async upsertCityStats(cityId: bigint, data: { salonCount: number; artistCount: number; avgRating: number }, tx?: TransactionClient) {
    return this.db(tx).cityStats.upsert({
      where: { cityId },
      update: data,
      create: { cityId, ...data },
    });
  }

  async findNeighborhoods(params: Prisma.NeighborhoodFindManyArgs, tx?: TransactionClient) {
    return this.db(tx).neighborhood.findMany(params);
  }

  async createNeighborhood(data: Prisma.NeighborhoodUncheckedCreateInput, tx?: TransactionClient) {
    return this.db(tx).neighborhood.create({ data });
  }

  async updateNeighborhood(id: bigint, data: Prisma.NeighborhoodUncheckedUpdateInput, tx?: TransactionClient) {
    return this.db(tx).neighborhood.update({ where: { id }, data });
  }

  async countSalons(where: Prisma.SalonWhereInput, tx?: TransactionClient) {
    return this.db(tx).salon.count({ where });
  }

  async countArtists(where: Prisma.ArtistWhereInput, tx?: TransactionClient) {
    return this.db(tx).artist.count({ where });
  }

  async aggregateSalons(args: Prisma.SalonAggregateArgs, tx?: TransactionClient) {
    return this.db(tx).salon.aggregate(args);
  }
}

export const geoRepository = new GeoRepository();
