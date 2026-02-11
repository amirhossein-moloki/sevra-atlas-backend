import { prisma } from '../db/prisma';
import { EntityType, RedirectType } from '@prisma/client';

export const handleSlugChange = async (
  entityType: EntityType,
  entityId: bigint,
  oldSlug: string,
  newSlug: string,
  basePath: string,
  tx?: any
) => {
  if (oldSlug === newSlug) return;
  const client = tx || prisma;

  // Insert into SlugHistory
  await client.slugHistory.create({
    data: {
      entityType,
      entityId,
      oldSlug,
      newSlug,
    },
  });

  // Create RedirectRule
  await client.redirectRule.create({
    data: {
      fromPath: `${basePath}/${oldSlug}`,
      toPath: `${basePath}/${newSlug}`,
      type: RedirectType.PERMANENT_301,
    },
  });

  // Update SitemapUrl if exists
  await client.sitemapUrl.updateMany({
    where: {
      entityType,
      entityId,
    },
    data: {
      path: `${basePath}/${newSlug}`,
    },
  });
};

export const initSeoMeta = async (
  entityType: EntityType,
  entityId: bigint,
  title?: string,
  tx?: any
) => {
  const client = tx || prisma;

  // Skip if seoMeta model is not available (useful for some mock tests)
  if (!client.seoMeta) return null;

  // Check if already exists
  const existing = await client.seoMeta.findUnique({
    where: { entityType_entityId: { entityType, entityId } }
  });

  if (existing) return existing;

  const seoMeta = await client.seoMeta.create({
    data: {
      entityType,
      entityId,
      title: title || null,
      h1: title || null,
    }
  });

  // Update entity link if applicable
  const linkedModels: EntityType[] = ['SALON', 'ARTIST', 'BLOG_POST', 'BLOG_PAGE', 'CITY', 'PROVINCE', 'CATEGORY'];
  if (linkedModels.includes(entityType) && client[getPrismaModelName(entityType)!]) {
    const modelName = getPrismaModelName(entityType);
    if (modelName) {
      await client[modelName].update({
        where: { id: entityId },
        data: { seoMetaId: seoMeta.id }
      });
    }
  }

  return seoMeta;
};

function getPrismaModelName(entityType: EntityType): string | null {
  switch (entityType) {
    case 'SALON': return 'salon';
    case 'ARTIST': return 'artist';
    case 'BLOG_POST': return 'post';
    case 'BLOG_PAGE': return 'page';
    case 'CITY': return 'city';
    case 'PROVINCE': return 'province';
    case 'CATEGORY': return 'category';
    default: return null;
  }
}
