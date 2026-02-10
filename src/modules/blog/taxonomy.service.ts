import { prisma } from '../../shared/db/prisma';
import { ApiError } from '../../shared/errors/ApiError';
import { handleSlugChange } from '../../shared/utils/seo';
import { EntityType } from '@prisma/client';
import { serialize } from '../../shared/utils/serialize';

export class BlogTaxonomyService {
  // Categories
  async listCategories() {
    const data = await prisma.category.findMany({
      where: { deletedAt: null },
      include: { parent: true }
    });
    return serialize(data);
  }

  async createCategory(data: any) {
    const result = await prisma.category.create({
      data: {
        ...data,
        parentId: data.parentId ? BigInt(data.parentId) : undefined
      }
    });
    return serialize(result);
  }

  async getCategory(id: string | bigint) {
    const categoryId = BigInt(id);
    const category = await prisma.category.findFirst({
      where: { id: categoryId, deletedAt: null },
      include: { parent: true }
    });
    if (!category) throw new ApiError(404, 'Category not found');
    return serialize(category);
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
      return serialize(result);
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
    return serialize(data);
  }

  async createTag(data: any) {
    const result = await prisma.tag.create({ data });
    return serialize(result);
  }

  async getTag(id: string | bigint) {
    const tagId = BigInt(id);
    const tag = await prisma.tag.findFirst({
      where: { id: tagId, deletedAt: null }
    });
    if (!tag) throw new ApiError(404, 'Tag not found');
    return serialize(tag);
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
      return serialize(result);
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
    return serialize(data);
  }

  async createSeries(data: any) {
    const result = await prisma.series.create({ data });
    return serialize(result);
  }

  async getSeries(id: string | bigint) {
    const seriesId = BigInt(id);
    const series = await prisma.series.findFirst({
      where: { id: seriesId, deletedAt: null }
    });
    if (!series) throw new ApiError(404, 'Series not found');
    return serialize(series);
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
      return serialize(result);
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
}
