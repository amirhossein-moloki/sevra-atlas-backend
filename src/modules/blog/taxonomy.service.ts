import { ApiError } from '../../shared/errors/ApiError';
import { handleSlugChange, initSeoMeta } from '../../shared/utils/seo';
import { EntityType } from '@prisma/client';
import { withTx } from '../../shared/db/tx';
import { taxonomyRepository, TaxonomyRepository } from './taxonomy.repository';

export class BlogTaxonomyService {
  constructor(
    private readonly repo: TaxonomyRepository = taxonomyRepository
  ) {}

  // Categories
  async listCategories() {
    return this.repo.findCategories({
      where: { deletedAt: null },
      include: { parent: true }
    });
  }

  async createCategory(data: any) {
    return withTx(async (tx) => {
      const result = await this.repo.createCategory({
        ...data,
        parentId: data.parentId ? BigInt(data.parentId) : undefined
      }, tx);
      await initSeoMeta(EntityType.CATEGORY, result.id, result.name, tx);
      return result;
    });
  }

  async getCategory(id: string | bigint) {
    const categoryId = BigInt(id);
    const category = await this.repo.findCategoryFirst({ id: categoryId, deletedAt: null }, { parent: true });
    if (!category) throw new ApiError(404, 'Category not found');
    return category;
  }

  async updateCategory(id: string | bigint, data: any) {
    const categoryId = BigInt(id);
    return withTx(async (tx) => {
      const category = await this.repo.findCategoryUnique(categoryId, undefined, tx);
      if (!category) throw new ApiError(404, 'Category not found');

      if (data.slug && data.slug !== category.slug) {
        await handleSlugChange(EntityType.CATEGORY, categoryId, category.slug, data.slug, '/blog/category', tx);
      }

      const { parentId, ...rest } = data;
      const result = await this.repo.updateCategory(categoryId, {
        ...rest,
        parentId: parentId ? BigInt(parentId) : (parentId === null ? null : undefined)
      }, tx);
      return result;
    });
  }

  async deleteCategory(id: string | bigint) {
    const categoryId = BigInt(id);
    await this.repo.softDeleteCategory(categoryId);
    return { ok: true };
  }

  // Tags
  async listTags() {
    return this.repo.findTags({
      where: { deletedAt: null }
    });
  }

  async createTag(data: any) {
    return withTx(async (tx) => {
      const result = await this.repo.createTag(data, tx);
      await initSeoMeta(EntityType.TAG, result.id, result.name, tx);
      return result;
    });
  }

  async getTag(id: string | bigint) {
    const tagId = BigInt(id);
    const tag = await this.repo.findTagFirst({ id: tagId, deletedAt: null });
    if (!tag) throw new ApiError(404, 'Tag not found');
    return tag;
  }

  async updateTag(id: string | bigint, data: any) {
    const tagId = BigInt(id);
    return withTx(async (tx) => {
      const tag = await this.repo.findTagUnique(tagId, tx);
      if (!tag) throw new ApiError(404, 'Tag not found');

      if (data.slug && data.slug !== tag.slug) {
        await handleSlugChange(EntityType.TAG, tagId, tag.slug, data.slug, '/blog/tag', tx);
      }

      const result = await this.repo.updateTag(tagId, data, tx);
      return result;
    });
  }

  async deleteTag(id: string | bigint) {
    const tagId = BigInt(id);
    await this.repo.softDeleteTag(tagId);
    return { ok: true };
  }

  // Series
  async listSeries() {
    return this.repo.findSeries({
      where: { deletedAt: null }
    });
  }

  async createSeries(data: any) {
    return withTx(async (tx) => {
      const result = await this.repo.createSeries(data, tx);
      await initSeoMeta(EntityType.SERIES, result.id, result.title, tx);
      return result;
    });
  }

  async getSeries(id: string | bigint) {
    const seriesId = BigInt(id);
    const series = await this.repo.findSeriesFirst({ id: seriesId, deletedAt: null });
    if (!series) throw new ApiError(404, 'Series not found');
    return series;
  }

  async updateSeries(id: string | bigint, data: any) {
    const seriesId = BigInt(id);
    return withTx(async (tx) => {
      const series = await this.repo.findSeriesUnique(seriesId, tx);
      if (!series) throw new ApiError(404, 'Series not found');

      if (data.slug && data.slug !== series.slug) {
        await handleSlugChange(EntityType.SERIES, seriesId, series.slug, data.slug, '/blog/series', tx);
      }

      const result = await this.repo.updateSeries(seriesId, data, tx);
      return result;
    });
  }

  async deleteSeries(id: string | bigint) {
    const seriesId = BigInt(id);
    await this.repo.softDeleteSeries(seriesId);
    return { ok: true };
  }

  async reorderCategories(items: { id: string | bigint, order: number }[]) {
    return withTx(async (tx) => {
      const results = [];
      for (const item of items) {
        const updated = await this.repo.updateCategory(BigInt(item.id), { order: item.order }, tx);
        results.push(updated);
      }
      return results;
    });
  }
}
