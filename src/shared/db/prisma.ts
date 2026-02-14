import { Prisma, PrismaClient } from '@prisma/client';
import { logger } from '../logger/logger';

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
});
