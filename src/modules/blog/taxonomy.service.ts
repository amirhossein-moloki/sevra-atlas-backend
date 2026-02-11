import { prisma } from '../../shared/db/prisma';
import { ApiError } from '../../shared/errors/ApiError';
import { handleSlugChange, initSeoMeta } from '../../shared/utils/seo';
import { EntityType } from '@prisma/client';

export class BlogTaxonomyService {
  // Categories
  async listCategories() {
    const data = await prisma.category.findMany({
      where: { deletedAt: null },
      include: { parent: true }
    });
    return data;
  }

  async createCategory(data: any) {
    return prisma.$transaction(async (tx) => {
      const result = await tx.category.create({
        data: {
          ...data,
          parentId: data.parentId ? BigInt(data.parentId) : undefined
        }
      });
      await initSeoMeta(EntityType.CATEGORY, result.id, result.name, tx);
      return result;
    });
  }

  async getCategory(id: string | bigint) {
    const categoryId = BigInt(id);
    const category = await prisma.category.findFirst({
      where: { id: categoryId, deletedAt: null },
      include: { parent: true }
    });
    if (!category) throw new ApiError(404, 'Category not found');
    return category;
  }

  async updateCategory(id: string | bigint, data: any) {
    const categoryId = BigInt(id);
    return prisma.$transaction(async (tx) => {
      const category = await tx.category.findUnique({ where: { id: categoryId } });
      if (!category) throw new ApiError(404, 'Category not found');

      if (data.slug && data.slug !== category.slug) {
        await handleSlugChange(EntityType.CATEGORY, categoryId, category.slug, data.slug, '/blog/category', tx);
      }

      const { parentId, ...rest } = data;
      const result = await tx.category.update({
        where: { id: categoryId },
        data: {
          ...rest,
          parentId: parentId ? BigInt(parentId) : (parentId === null ? null : undefined)
        }
      });
      return result;
    });
  }

  async deleteCategory(id: string | bigint) {
    const categoryId = BigInt(id);
    await prisma.category.update({
      where: { id: categoryId },
      data: { deletedAt: new Date() }
    });
    return { ok: true };
  }

  // Tags
  async listTags() {
    const data = await prisma.tag.findMany({
      where: { deletedAt: null }
    });
    return data;
  }

  async createTag(data: any) {
    return prisma.$transaction(async (tx) => {
      const result = await tx.tag.create({ data });
      await initSeoMeta(EntityType.TAG, result.id, result.name, tx);
      return result;
    });
  }

  async getTag(id: string | bigint) {
    const tagId = BigInt(id);
    const tag = await prisma.tag.findFirst({
      where: { id: tagId, deletedAt: null }
    });
    if (!tag) throw new ApiError(404, 'Tag not found');
    return tag;
  }

  async updateTag(id: string | bigint, data: any) {
    const tagId = BigInt(id);
    return prisma.$transaction(async (tx) => {
      const tag = await tx.tag.findUnique({ where: { id: tagId } });
      if (!tag) throw new ApiError(404, 'Tag not found');

      if (data.slug && data.slug !== tag.slug) {
        await handleSlugChange(EntityType.TAG, tagId, tag.slug, data.slug, '/blog/tag', tx);
      }

      const result = await tx.tag.update({ where: { id: tagId }, data });
      return result;
    });
  }

  async deleteTag(id: string | bigint) {
    const tagId = BigInt(id);
    await prisma.tag.update({
      where: { id: tagId },
      data: { deletedAt: new Date() }
    });
    return { ok: true };
  }

  // Series
  async listSeries() {
    const data = await prisma.series.findMany({
      where: { deletedAt: null }
    });
    return data;
  }

  async createSeries(data: any) {
    return prisma.$transaction(async (tx) => {
      const result = await tx.series.create({ data });
      await initSeoMeta(EntityType.SERIES, result.id, result.title, tx);
      return result;
    });
  }

  async getSeries(id: string | bigint) {
    const seriesId = BigInt(id);
    const series = await prisma.series.findFirst({
      where: { id: seriesId, deletedAt: null }
    });
    if (!series) throw new ApiError(404, 'Series not found');
    return series;
  }

  async updateSeries(id: string | bigint, data: any) {
    const seriesId = BigInt(id);
    return prisma.$transaction(async (tx) => {
      const series = await tx.series.findUnique({ where: { id: seriesId } });
      if (!series) throw new ApiError(404, 'Series not found');

      if (data.slug && data.slug !== series.slug) {
        await handleSlugChange(EntityType.SERIES, seriesId, series.slug, data.slug, '/blog/series', tx);
      }

      const result = await tx.series.update({ where: { id: seriesId }, data });
      return result;
    });
  }

  async deleteSeries(id: string | bigint) {
    const seriesId = BigInt(id);
    await prisma.series.update({
      where: { id: seriesId },
      data: { deletedAt: new Date() }
    });
    return { ok: true };
  }

  async reorderCategories(items: { id: string | bigint, order: number }[]) {
    return prisma.$transaction(
      items.map(item => prisma.category.update({
        where: { id: BigInt(item.id) },
        data: { order: item.order }
      }))
    );
  }
}
