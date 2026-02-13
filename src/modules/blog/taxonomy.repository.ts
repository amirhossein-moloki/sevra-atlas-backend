import { prisma } from '../../shared/db/prisma';
import { TransactionClient } from '../../shared/db/tx';
import { Prisma } from '@prisma/client';

export class TaxonomyRepository {
  private db(tx?: TransactionClient) {
    return tx || prisma;
  }

  // Categories
  async findCategories(params: Prisma.CategoryFindManyArgs, tx?: TransactionClient) {
    return this.db(tx).category.findMany(params);
  }

  async findCategoryUnique(id: bigint, include?: Prisma.CategoryInclude, tx?: TransactionClient) {
    return (this.db(tx).category.findUnique({ where: { id }, include }) as any);
  }

  async findCategoryFirst(where: Prisma.CategoryWhereInput, include?: Prisma.CategoryInclude, tx?: TransactionClient) {
    return (this.db(tx).category.findFirst({ where, include }) as any);
  }

  async createCategory(data: Prisma.CategoryUncheckedCreateInput, tx?: TransactionClient) {
    return this.db(tx).category.create({ data });
  }

  async updateCategory(id: bigint, data: Prisma.CategoryUncheckedUpdateInput, tx?: TransactionClient) {
    return this.db(tx).category.update({ where: { id }, data });
  }

  async softDeleteCategory(id: bigint, tx?: TransactionClient) {
    return this.db(tx).category.update({ where: { id }, data: { deletedAt: new Date() } });
  }

  // Tags
  async findTags(params: Prisma.TagFindManyArgs, tx?: TransactionClient) {
    return this.db(tx).tag.findMany(params);
  }

  async findTagUnique(id: bigint, tx?: TransactionClient) {
    return this.db(tx).tag.findUnique({ where: { id } });
  }

  async findTagFirst(where: Prisma.TagWhereInput, tx?: TransactionClient) {
    return this.db(tx).tag.findFirst({ where });
  }

  async createTag(data: Prisma.TagUncheckedCreateInput, tx?: TransactionClient) {
    return this.db(tx).tag.create({ data });
  }

  async updateTag(id: bigint, data: Prisma.TagUncheckedUpdateInput, tx?: TransactionClient) {
    return this.db(tx).tag.update({ where: { id }, data });
  }

  async softDeleteTag(id: bigint, tx?: TransactionClient) {
    return this.db(tx).tag.update({ where: { id }, data: { deletedAt: new Date() } });
  }

  // Series
  async findSeries(params: Prisma.SeriesFindManyArgs, tx?: TransactionClient) {
    return this.db(tx).series.findMany(params);
  }

  async findSeriesUnique(id: bigint, tx?: TransactionClient) {
    return this.db(tx).series.findUnique({ where: { id } });
  }

  async findSeriesFirst(where: Prisma.SeriesWhereInput, tx?: TransactionClient) {
    return this.db(tx).series.findFirst({ where });
  }

  async createSeries(data: Prisma.SeriesUncheckedCreateInput, tx?: TransactionClient) {
    return this.db(tx).series.create({ data });
  }

  async updateSeries(id: bigint, data: Prisma.SeriesUncheckedUpdateInput, tx?: TransactionClient) {
    return this.db(tx).series.update({ where: { id }, data });
  }

  async softDeleteSeries(id: bigint, tx?: TransactionClient) {
    return this.db(tx).series.update({ where: { id }, data: { deletedAt: new Date() } });
  }
}

export const taxonomyRepository = new TaxonomyRepository();
