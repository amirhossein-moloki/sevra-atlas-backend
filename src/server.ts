import app from './app';
import { env } from './shared/config/env';
import { logger } from './shared/logger/logger';
import { prisma } from './shared/db/prisma';

async function start() {
  try {
    await prisma.$connect();
    logger.info('Connected to Database');

    app.listen(env.PORT, () => {
      logger.info(`Server is running on port ${env.PORT} in ${env.NODE_ENV} mode`);
      logger.info(`API Documentation: http://localhost:${env.PORT}/api-docs`);
    });
  } catch (error) {
    logger.error('Failed to start server', error);
    process.exit(1);
  }
}

start();
