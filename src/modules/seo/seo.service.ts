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
    // 1. Clear existing sitemap
    await prisma.sitemapUrl.deleteMany({});

    let count = 0;

    // 2. Add Cities
    const cities = await prisma.city.findMany({ where: { isLandingEnabled: true } });
    for (const city of cities) {
      await prisma.sitemapUrl.create({
        data: {
          path: `/atlas/city/${city.slug}`,
          entityType: EntityType.CITY,
          entityId: city.id,
          priority: 0.8,
        },
      });
      count++;
    }

    // 3. Add Salons
    const salons = await prisma.salon.findMany({ where: { status: 'ACTIVE' } });
    for (const salon of salons) {
      await prisma.sitemapUrl.create({
        data: {
          path: `/atlas/salon/${salon.slug}`,
          entityType: EntityType.SALON,
          entityId: salon.id,
          priority: salon.verification === 'VERIFIED' ? 0.7 : 0.5,
        },
      });
      count++;
    }

    // 4. Add Artists
    const artists = await prisma.artist.findMany({ where: { status: 'ACTIVE' } });
    for (const artist of artists) {
      await prisma.sitemapUrl.create({
        data: {
          path: `/atlas/artist/${artist.slug}`,
          entityType: EntityType.ARTIST,
          entityId: artist.id,
          priority: artist.verification === 'VERIFIED' ? 0.7 : 0.5,
        },
      });
      count++;
    }

    // 5. Add Blog Posts
    const posts = await prisma.post.findMany({ where: { status: 'published' } });
    for (const post of posts) {
      await prisma.sitemapUrl.create({
        data: {
          path: `/blog/post/${post.slug}`,
          entityType: EntityType.BLOG_POST,
          entityId: post.id,
          priority: 0.6,
        },
      });
      count++;
    }

    return { ok: true, rebuilt: count };
  }
}
