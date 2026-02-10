import { prisma } from '../../shared/db/prisma';
import { ApiError } from '../../shared/errors/ApiError';

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

  async getCategory(id: bigint) {
    const category = await prisma.category.findUnique({
      where: { id },
      include: { parent: true }
    });
    if (!category) throw new ApiError(404, 'Category not found');
    return category;
  }

  async updateCategory(id: bigint, data: any) {
    const { parentId, ...rest } = data;
    return prisma.category.update({
      where: { id },
      data: {
        ...rest,
        parentId: parentId ? BigInt(parentId) : (parentId === null ? null : undefined)
      }
    });
  }

  async deleteCategory(id: bigint) {
    await prisma.category.delete({ where: { id } });
    return { ok: true };
  }

  // Tags
  async listTags() {
    return prisma.tag.findMany();
  }

  async createTag(data: any) {
    return prisma.tag.create({ data });
  }

  async getTag(id: bigint) {
    const tag = await prisma.tag.findUnique({ where: { id } });
    if (!tag) throw new ApiError(404, 'Tag not found');
    return tag;
  }

  async updateTag(id: bigint, data: any) {
    return prisma.tag.update({ where: { id }, data });
  }

  async deleteTag(id: bigint) {
    await prisma.tag.delete({ where: { id } });
    return { ok: true };
  }

  // Series
  async listSeries() {
    return prisma.series.findMany();
  }

  async createSeries(data: any) {
    return prisma.series.create({ data });
  }

  async getSeries(id: bigint) {
    const series = await prisma.series.findUnique({ where: { id } });
    if (!series) throw new ApiError(404, 'Series not found');
    return series;
  }

  async updateSeries(id: bigint, data: any) {
    return prisma.series.update({ where: { id }, data });
  }

  async deleteSeries(id: bigint) {
    await prisma.series.delete({ where: { id } });
    return { ok: true };
  }
}
