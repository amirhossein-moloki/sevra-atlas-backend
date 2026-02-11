import { prisma } from '../../shared/db/prisma';
import { EntityType, AccountStatus, VerificationStatus } from '@prisma/client';
import { ApiError } from '../../shared/errors/ApiError';

export class SeoService {
  async resolveRedirect(path: string) {
    return prisma.redirectRule.findFirst({
      where: { fromPath: path, isActive: true },
    });
  }

  async setSeoMeta(data: any) {
    const { entityType, entityId, ...meta } = data;
    const id = BigInt(entityId);

    return prisma.$transaction(async (tx) => {
      const seoMeta = await tx.seoMeta.upsert({
        where: {
          entityType_entityId: { entityType, entityId: id },
        },
        update: {
          ...meta,
          ogImageMediaId: meta.ogImageMediaId ? BigInt(meta.ogImageMediaId) : undefined,
          twitterImageMediaId: meta.twitterImageMediaId ? BigInt(meta.twitterImageMediaId) : undefined,
        },
        create: {
          entityType,
          entityId: id,
          ...meta,
          ogImageMediaId: meta.ogImageMediaId ? BigInt(meta.ogImageMediaId) : undefined,
          twitterImageMediaId: meta.twitterImageMediaId ? BigInt(meta.twitterImageMediaId) : undefined,
        },
      });

      // Update the target entity's seoMetaId if it supports it
      const entityModels: Record<string, any> = {
        SALON: tx.salon,
        ARTIST: tx.artist,
        BLOG_POST: tx.post,
        BLOG_PAGE: tx.page,
        CITY: tx.city,
        PROVINCE: tx.province,
        CATEGORY: tx.category,
        TAG: tx.tag,
        SERIES: tx.series,
      };

      const targetModel = entityModels[entityType];
      if (targetModel) {
        // Check if entity exists
        const entity = await targetModel.findUnique({ where: { id } });
        if (!entity) {
          throw new ApiError(404, `${entityType} with ID ${id} not found`);
        }

        // Only update if the model has seoMetaId (check Tag/Series which don't)
        if (['SALON', 'ARTIST', 'BLOG_POST', 'BLOG_PAGE', 'CITY', 'PROVINCE', 'CATEGORY'].includes(entityType)) {
          await targetModel.update({
            where: { id },
            data: { seoMetaId: seoMeta.id },
          });
        }
      }

      return seoMeta;
    });
  }

  async createRedirect(data: any) {
    return prisma.redirectRule.create({ data });
  }

  async rebuildSitemap() {
    return prisma.$transaction(async (tx) => {
      // 1. Clear existing sitemap
      await tx.sitemapUrl.deleteMany({});

      const entries: any[] = [];

      // 2. Add Provinces
      const provinces = await tx.province.findMany();
      for (const province of provinces) {
        entries.push({
          path: `/atlas/province/${province.slug}`,
          entityType: EntityType.PROVINCE,
          entityId: province.id,
          priority: 0.9,
        });
      }

      // 3. Add Cities
      const cities = await tx.city.findMany({ where: { isLandingEnabled: true } });
      for (const city of cities) {
        entries.push({
          path: `/atlas/city/${city.slug}`,
          entityType: EntityType.CITY,
          entityId: city.id,
          priority: 0.8,
        });
      }

      // 4. Add Salons
      const salons = await tx.salon.findMany({ where: { status: AccountStatus.ACTIVE } });
      for (const salon of salons) {
        entries.push({
          path: `/atlas/salon/${salon.slug}`,
          entityType: EntityType.SALON,
          entityId: salon.id,
          priority: salon.verification === VerificationStatus.VERIFIED ? 0.7 : 0.5,
        });
      }

      // 5. Add Artists
      const artists = await tx.artist.findMany({ where: { status: AccountStatus.ACTIVE } });
      for (const artist of artists) {
        entries.push({
          path: `/atlas/artist/${artist.slug}`,
          entityType: EntityType.ARTIST,
          entityId: artist.id,
          priority: artist.verification === VerificationStatus.VERIFIED ? 0.7 : 0.5,
        });
      }

      // 6. Add Blog Posts
      const posts = await tx.post.findMany({
        where: {
          status: 'published',
          visibility: 'public'
        }
      });
      for (const post of posts) {
        entries.push({
          path: `/blog/post/${post.slug}`,
          entityType: EntityType.BLOG_POST,
          entityId: post.id,
          priority: 0.6,
        });
      }

      // 7. Add Blog Pages
      const pages = await tx.page.findMany({ where: { status: 'published' } });
      for (const page of pages) {
        entries.push({
          path: `/blog/page/${page.slug}`,
          entityType: EntityType.BLOG_PAGE,
          entityId: page.id,
          priority: 0.5,
        });
      }

      // 8. Add Categories
      const categories = await tx.category.findMany();
      for (const category of categories) {
        entries.push({
          path: `/blog/category/${category.slug}`,
          entityType: EntityType.CATEGORY,
          entityId: category.id,
          priority: 0.4,
        });
      }

      // 9. Add Tags
      const tags = await tx.tag.findMany();
      for (const tag of tags) {
        entries.push({
          path: `/blog/tag/${tag.slug}`,
          entityType: EntityType.TAG,
          entityId: tag.id,
          priority: 0.3,
        });
      }

      // 10. Add Series
      const series = await tx.series.findMany();
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
        await tx.sitemapUrl.createMany({
          data: entries,
          skipDuplicates: true,
        });
      }

      return { ok: true, rebuilt: entries.length };
    }, {
      timeout: 30000, // Extend timeout for large rebuilds
    });
  }
}
