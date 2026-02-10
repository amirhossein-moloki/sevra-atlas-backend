import { prisma } from '../db/prisma';
import { EntityType, RedirectType } from '@prisma/client';

export const handleSlugChange = async (
  entityType: EntityType,
  entityId: bigint,
  oldSlug: string,
  newSlug: string,
  basePath: string
) => {
  if (oldSlug === newSlug) return;

  // Insert into SlugHistory
  await prisma.slugHistory.create({
    data: {
      entityType,
      entityId,
      oldSlug,
      newSlug,
    },
  });

  // Create RedirectRule
  await prisma.redirectRule.create({
    data: {
      fromPath: `${basePath}/${oldSlug}`,
      toPath: `${basePath}/${newSlug}`,
      type: RedirectType.PERMANENT_301,
    },
  });
};
