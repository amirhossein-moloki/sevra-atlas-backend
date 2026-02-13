import app from './app';
import { env } from './shared/config/env';
import { logger } from './shared/logger/logger';
import { prisma } from './shared/db/prisma';
import { startWorkers } from './modules/workers';
import { initAdminJS } from './adminjs';

async function start() {
  try {
    await prisma.$connect();
    logger.info('Connected to Database');

    // Initialize and mount AdminJS backoffice
    const adminJs = await initAdminJS(app, prisma);
    if (adminJs) {
        logger.info(`AdminJS Backoffice mounted at ${adminJs.options.rootPath}`);
    }

    let server: any;

    if (env.IS_WORKER) {
      const { startWorkersGracefully } = await import('./modules/workers');
      startWorkersGracefully();
      logger.info('Worker process started');
    } else {
      server = app.listen(env.PORT, () => {
        logger.info(`Server is running on port ${env.PORT} in ${env.NODE_ENV} mode`);
        logger.info(`API Documentation: http://localhost:${env.PORT}/api-docs`);
        if (adminJs) {
            logger.info(`AdminJS Panel: http://localhost:${env.PORT}${adminJs.options.rootPath}`);
        }
      });
    }

    // Graceful shutdown logic
    const gracefulShutdown = async (signal: string) => {
      logger.info(`${signal} received. Starting graceful shutdown...`);

      if (server) {
        server.close(() => {
          logger.info('HTTP server closed.');
        });
      }

      // If we had workers started in the same process, we should stop them too
      if (env.IS_WORKER) {
        const { stopWorkers } = await import('./modules/workers');
        await stopWorkers();
        logger.info('Workers stopped.');
      }

      try {
        await prisma.$disconnect();
        logger.info('Database connection closed.');

        const { closeRedisConnections } = await import('./shared/redis/redis');
        await closeRedisConnections();
        logger.info('Redis connections closed.');

        process.exit(0);
      } catch (err) {
        logger.error('Error during graceful shutdown:', err);
        process.exit(1);
      }
    };

    process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
    process.on('SIGINT', () => gracefulShutdown('SIGINT'));

  } catch (error) {
    logger.error('Failed to start server', error);
    process.exit(1);
  }
}

start();
