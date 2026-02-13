import { EntityType, AccountStatus, VerificationStatus } from '@prisma/client';
import { ApiError } from '../../shared/errors/ApiError';
import { seoRepository, SeoRepository } from './seo.repository';
import { withTx } from '../../shared/db/tx';

export class SeoService {
  constructor(
    private readonly repo: SeoRepository = seoRepository
  ) {}

  async resolveRedirect(path: string) {
    return this.repo.findRedirectRule({ fromPath: path, isActive: true });
  }

  async setSeoMeta(data: any) {
    const { entityType, entityId, ...meta } = data;
    const id = BigInt(entityId);

    return withTx(async (tx) => {
      const seoMeta = await this.repo.upsertSeoMeta(entityType, id, {
        ...meta,
        ogImageMediaId: meta.ogImageMediaId ? BigInt(meta.ogImageMediaId) : undefined,
        twitterImageMediaId: meta.twitterImageMediaId ? BigInt(meta.twitterImageMediaId) : undefined,
      }, tx);

      // Check if entity exists
      const entity = await this.repo.findEntity(entityType, id, tx);
      if (!entity) {
        throw new ApiError(404, `${entityType} with ID ${id} not found`);
      }

      // Update the target entity's seoMetaId if it supports it
      if (['SALON', 'ARTIST', 'BLOG_POST', 'BLOG_PAGE', 'CITY', 'PROVINCE', 'CATEGORY'].includes(entityType)) {
        await this.repo.updateEntitySeoMetaId(entityType, id, seoMeta.id, tx);
      }

      return seoMeta;
    });
  }

  async createRedirect(data: any) {
    return this.repo.createRedirectRule(data);
  }

  async rebuildSitemap() {
    return withTx(async (tx) => {
      // 1. Clear existing sitemap
      await this.repo.deleteSitemapUrls({}, tx);

      const entries: any[] = [];

      // 2. Add Provinces
      const provinces = await this.repo.getAllProvinces(tx);
      for (const province of provinces) {
        entries.push({
          path: `/atlas/province/${province.slug}`,
          entityType: EntityType.PROVINCE,
          entityId: province.id,
          priority: 0.9,
        });
      }

      // 3. Add Cities
      const cities = await this.repo.getSitemapCities(tx);
      for (const city of cities) {
        entries.push({
          path: `/atlas/city/${city.slug}`,
          entityType: EntityType.CITY,
          entityId: city.id,
          priority: 0.8,
        });
      }

      // 4. Add Salons
      const salons = await this.repo.getActiveSalons(tx);
      for (const salon of salons) {
        entries.push({
          path: `/atlas/salon/${salon.slug}`,
          entityType: EntityType.SALON,
          entityId: salon.id,
          priority: salon.verification === VerificationStatus.VERIFIED ? 0.7 : 0.5,
        });
      }

      // 5. Add Artists
      const artists = await this.repo.getActiveArtists(tx);
      for (const artist of artists) {
        entries.push({
          path: `/atlas/artist/${artist.slug}`,
          entityType: EntityType.ARTIST,
          entityId: artist.id,
          priority: artist.verification === VerificationStatus.VERIFIED ? 0.7 : 0.5,
        });
      }

      // 6. Add Blog Posts
      const posts = await this.repo.getPublishedPosts(tx);
      for (const post of posts) {
        entries.push({
          path: `/blog/post/${post.slug}`,
          entityType: EntityType.BLOG_POST,
          entityId: post.id,
          priority: 0.6,
        });
      }

      // 7. Add Blog Pages
      const pages = await this.repo.getPublishedPages(tx);
      for (const page of pages) {
        entries.push({
          path: `/blog/page/${page.slug}`,
          entityType: EntityType.BLOG_PAGE,
          entityId: page.id,
          priority: 0.5,
        });
      }

      // 8. Add Categories
      const categories = await this.repo.getAllCategories(tx);
      for (const category of categories) {
        entries.push({
          path: `/blog/category/${category.slug}`,
          entityType: EntityType.CATEGORY,
          entityId: category.id,
          priority: 0.4,
        });
      }

      // 9. Add Tags
      const tags = await this.repo.getAllTags(tx);
      for (const tag of tags) {
        entries.push({
          path: `/blog/tag/${tag.slug}`,
          entityType: EntityType.TAG,
          entityId: tag.id,
          priority: 0.3,
        });
      }

      // 10. Add Series
      const series = await this.repo.getAllSeries(tx);
      for (const s of series) {
        entries.push({
          path: `/blog/series/${s.slug}`,
          entityType: EntityType.SERIES,
          entityId: s.id,
          priority: 0.3,
        });
      }

      // 11. Bulk insert
      if (entries.length > 0) {
        await this.repo.createSitemapUrls(entries, tx);
      }

      return { ok: true, rebuilt: entries.length };
    }, { timeout: 30000 });
  }
}
