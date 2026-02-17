import { Prisma, PrismaClient } from '@prisma/client';
import { logger } from '../logger/logger';
import { dbQueryDuration } from '../metrics';

export const prisma = new PrismaClient({
  log: [
    { emit: 'event', level: 'query' },
    { emit: 'stdout', level: 'error' },
    { emit: 'stdout', level: 'info' },
    { emit: 'stdout', level: 'warn' },
  ],
});

(prisma as PrismaClient<Prisma.PrismaClientOptions, 'query'>).$on('query', (e) => {
  logger.debug(`Query: ${e.query} Params: ${e.params} Duration: ${e.duration}ms`);

  // Track DB metrics
  // We can try to extract the model name from the query, but for now we'll just track operation
  const operation = e.query.split(' ')[0].toLowerCase();
  dbQueryDuration.labels(operation, 'unknown').observe(e.duration / 1000);
});
