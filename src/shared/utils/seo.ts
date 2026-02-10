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
