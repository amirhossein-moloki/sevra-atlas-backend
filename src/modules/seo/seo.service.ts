import { prisma } from '../../shared/db/prisma';
import { EntityType } from '@prisma/client';

export class SeoService {
  async resolveRedirect(path: string) {
    return prisma.redirectRule.findFirst({
      where: { fromPath: path, isActive: true },
    });
  }

  async setSeoMeta(data: any) {
    const { entityType, entityId, ...meta } = data;
    const id = BigInt(entityId);
    
    return prisma.seoMeta.upsert({
      where: {
        entityType_entityId: { entityType, entityId: id },
      },
      update: {
        ...meta,
        ogImageMediaId: meta.ogImageMediaId ? BigInt(meta.ogImageMediaId) : undefined,
      },
      create: {
        entityType,
        entityId: id,
        ...meta,
        ogImageMediaId: meta.ogImageMediaId ? BigInt(meta.ogImageMediaId) : undefined,
      },
    });
  }

  async createRedirect(data: any) {
    return prisma.redirectRule.create({ data });
  }

  async rebuildSitemap() {
    // Basic logic to rebuild SitemapUrl table from published entities
    // This is a placeholder for a more complex logic
    return { message: 'Sitemap rebuild started' };
  }
}
