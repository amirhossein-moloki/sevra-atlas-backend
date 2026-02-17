import { prisma } from '../shared/db/prisma';
import { updateEntityVisibilityScore } from '../shared/utils/ranking-updater';
import { logger } from '../shared/logger/logger';

async function main() {
  logger.info('Starting visibility score recomputation...');

  const salons = await prisma.salon.findMany({ select: { id: true } });
  logger.info(`Processing ${salons.length} salons...`);
  for (const salon of salons) {
    await updateEntityVisibilityScore('SALON', salon.id);
  }

  const artists = await prisma.artist.findMany({ select: { id: true } });
  logger.info(`Processing ${artists.length} artists...`);
  for (const artist of artists) {
    await updateEntityVisibilityScore('ARTIST', artist.id);
  }

  logger.info('Recomputation finished.');
}

main()
  .catch(err => {
    logger.error('Error recomputing scores:', err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
