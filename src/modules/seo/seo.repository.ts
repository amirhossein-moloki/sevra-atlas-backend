import { prisma } from '../../shared/db/prisma';
import { TransactionClient } from '../../shared/db/tx';
import { Prisma, EntityType } from '@prisma/client';

export class SeoRepository {
  private db(tx?: TransactionClient) {
    return tx || prisma;
  }

  async findRedirectRule(where: Prisma.RedirectRuleWhereInput, tx?: TransactionClient) {
    return this.db(tx).redirectRule.findFirst({ where });
  }

  async createRedirectRule(data: Prisma.RedirectRuleUncheckedCreateInput, tx?: TransactionClient) {
    return this.db(tx).redirectRule.create({ data });
  }

  async upsertSeoMeta(entityType: EntityType, entityId: bigint, data: any, tx?: TransactionClient) {
    return this.db(tx).seoMeta.upsert({
      where: {
        entityType_entityId: { entityType, entityId },
      },
      update: data,
      create: { entityType, entityId, ...data },
    });
  }

  async deleteSitemapUrls(where: Prisma.SitemapUrlWhereInput, tx?: TransactionClient) {
    return this.db(tx).sitemapUrl.deleteMany({ where });
  }

  async createSitemapUrls(data: Prisma.SitemapUrlCreateManyInput[], tx?: TransactionClient) {
    return this.db(tx).sitemapUrl.createMany({ data, skipDuplicates: true });
  }

  // Helper to update entity link - can be moved to specific repos later
  async updateEntitySeoMetaId(entityType: EntityType, entityId: bigint, seoMetaId: bigint, tx?: TransactionClient) {
    const db = this.db(tx);
    const modelMap: Record<string, any> = {
      SALON: db.salon,
      ARTIST: db.artist,
      BLOG_POST: db.post,
      BLOG_PAGE: db.page,
      CITY: db.city,
      PROVINCE: db.province,
      CATEGORY: db.category,
    };

    const model = modelMap[entityType];
    if (model) {
      return model.update({
        where: { id: entityId },
        data: { seoMetaId },
      });
    }
  }

  async findEntity(entityType: EntityType, entityId: bigint, tx?: TransactionClient) {
    const db = this.db(tx);
    const modelMap: Record<string, any> = {
      SALON: db.salon,
      ARTIST: db.artist,
      BLOG_POST: db.post,
      BLOG_PAGE: db.page,
      CITY: db.city,
      PROVINCE: db.province,
      CATEGORY: db.category,
      TAG: db.tag,
      SERIES: db.series,
    };
    const model = modelMap[entityType];
    if (model) {
      return model.findUnique({ where: { id: entityId } });
    }
    return null;
  }

  // Sitemap data fetchers
  async getAllProvinces(tx?: TransactionClient) {
    return this.db(tx).province.findMany();
  }

  async getSitemapCities(tx?: TransactionClient) {
    return this.db(tx).city.findMany({ where: { isLandingEnabled: true } });
  }

  async getActiveSalons(tx?: TransactionClient) {
    return this.db(tx).salon.findMany({ where: { status: 'ACTIVE' } });
  }

  async getActiveArtists(tx?: TransactionClient) {
    return this.db(tx).artist.findMany({ where: { status: 'ACTIVE' } });
  }

  async getPublishedPosts(tx?: TransactionClient) {
    return this.db(tx).post.findMany({
      where: {
        status: 'published',
        visibility: 'public'
      }
    });
  }

  async getPublishedPages(tx?: TransactionClient) {
    return this.db(tx).page.findMany({ where: { status: 'published' } });
  }

  async getAllCategories(tx?: TransactionClient) {
    return this.db(tx).category.findMany();
  }

  async getAllTags(tx?: TransactionClient) {
    return this.db(tx).tag.findMany();
  }

  async getAllSeries(tx?: TransactionClient) {
    return this.db(tx).series.findMany();
  }
}

export const seoRepository = new SeoRepository();
