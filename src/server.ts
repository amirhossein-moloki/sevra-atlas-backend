import app from './app';
import { env } from './shared/config/env';
import { logger } from './shared/logger/logger';
import { prisma } from './shared/db/prisma';
import { startWorkers } from './modules/workers';

async function start() {
  try {
    await prisma.$connect();
    logger.info('Connected to Database');

    if (env.IS_WORKER) {
      startWorkers();
      logger.info('Worker process started');
    } else {
      app.listen(env.PORT, () => {
        logger.info(`Server is running on port ${env.PORT} in ${env.NODE_ENV} mode`);
        logger.info(`API Documentation: http://localhost:${env.PORT}/api-docs`);
      });
    }
  } catch (error) {
    logger.error('Failed to start server', error);
    process.exit(1);
  }
}

start();
