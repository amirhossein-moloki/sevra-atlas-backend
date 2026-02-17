import { Worker, Queue } from 'bullmq';
import { redisQueue } from '../../shared/redis/redis';
import { SubscriptionsService } from '../subscriptions/subscriptions.service';
import { logger } from '../../shared/logger/logger';
import { updateEntityVisibilityScore } from '../../shared/utils/ranking-updater';
import { prisma } from '../../shared/db/prisma';

const subService = new SubscriptionsService();

export const billingQueue = new Queue('billing', { connection: redisQueue.options });

export const billingWorker = new Worker(
  'billing',
  async (job) => {
    if (job.name === 'check-expirations') {
      logger.info('Running background expiration check...');
      const count = await subService.checkExpirations();
      logger.info(`Processed ${count} expired subscriptions.`);
    } else if (job.name === 'recompute-scores') {
      logger.info('Running background score recomputation...');
      const salons = await prisma.salon.findMany({ select: { id: true } });
      for (const salon of salons) {
        await updateEntityVisibilityScore('SALON', salon.id);
      }
      const artists = await prisma.artist.findMany({ select: { id: true } });
      for (const artist of artists) {
        await updateEntityVisibilityScore('ARTIST', artist.id);
      }
      logger.info('Recomputed all scores.');
    }
  },
  { connection: redisQueue.options }
);

export const scheduleRecurringBillingJobs = async () => {
  // Check expirations every hour
  await billingQueue.add('check-expirations', {}, {
    repeat: { pattern: '0 * * * *' },
    removeOnComplete: true,
  });

  // Recompute scores every day at 3 AM
  await billingQueue.add('recompute-scores', {}, {
    repeat: { pattern: '0 3 * * *' },
    removeOnComplete: true,
  });

  logger.info('Recurring billing jobs scheduled.');
};
