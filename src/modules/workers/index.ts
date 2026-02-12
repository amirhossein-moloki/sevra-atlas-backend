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

  // Health check server for Worker process
  if (env.IS_WORKER) {
    const healthApp = express();
    healthApp.get('/health', (req, res) => {
      res.json({
        status: 'OK',
        worker: true,
        uptime: process.uptime(),
        memory: process.memoryUsage(),
      });
    });
    const port = env.PORT || 3001;
    healthApp.listen(port, () => {
      logger.info(`Worker health check server running on port ${port}`);
    });
  }
};
