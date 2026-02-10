import { prisma } from '../../../shared/db/prisma';
import { ApiError } from '../../../shared/errors/ApiError';

export class BlogTaxonomyService {
  // Categories
  async listCategories() {
    return prisma.category.findMany({ include: { parent: true } });
  }

  async createCategory(data: any) {
    return prisma.category.create({
      data: {
        ...data,
        parentId: data.parentId ? BigInt(data.parentId) : undefined
      }
    });
  }

  // Tags
  async listTags() {
    return prisma.tag.findMany();
  }

  async createTag(data: any) {
    return prisma.tag.create({ data });
  }

  // Series
  async listSeries() {
    return prisma.series.findMany();
  }

  async createSeries(data: any) {
    return prisma.series.create({ data });
  }
}
