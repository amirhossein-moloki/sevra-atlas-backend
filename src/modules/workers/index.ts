import { mediaWorker } from './media.worker';
import { logger } from '../../shared/logger/logger';
import express from 'express';
import { env } from '../../shared/config/env';

export const startWorkers = () => {
  logger.info('Starting background workers...');

  mediaWorker.on('completed', (job) => {
    logger.info(`Job ${job.id} completed successfully`);
  });

  mediaWorker.on('failed', (job, err) => {
    logger.error(`Job ${job?.id} failed:`, err);
  });

  // Graceful shutdown
  const shutdown = async () => {
    logger.info('Shutting down workers...');
    await mediaWorker.close();
    process.exit(0);
  };

  process.on('SIGTERM', shutdown);
  process.on('SIGINT', shutdown);
};

export const stopWorkers = async () => {
  logger.info('Stopping background workers...');
  await mediaWorker.close();
};

export const startWorkersGracefully = () => {
  startWorkers();

  // Health check server for Worker process
  if (env.IS_WORKER) {
    const healthApp = express();
    healthApp.get('/health', async (req, res) => {
      const { redisQueue } = await import('../../shared/redis/redis');
      const { adminRepository } = await import('../admin/admin.repository');

      let isHealthy = true;
      const services = {
        database: 'UNKNOWN',
        redis: 'UNKNOWN'
      };

      try {
        await adminRepository.ping();
        services.database = 'CONNECTED';
      } catch (e) {
        services.database = 'DISCONNECTED';
        isHealthy = false;
      }

      try {
        await redisQueue.ping();
        services.redis = 'CONNECTED';
      } catch (e) {
        services.redis = 'DISCONNECTED';
        isHealthy = false;
      }

      res.status(isHealthy ? 200 : 503).json({
        status: isHealthy ? 'OK' : 'ERROR',
        worker: true,
        uptime: process.uptime(),
        memory: process.memoryUsage(),
        services
      });
    });
    const port = env.PORT || 3001;
    healthApp.listen(port, () => {
      logger.info(`Worker health check server running on port ${port}`);
    });
  }
};
