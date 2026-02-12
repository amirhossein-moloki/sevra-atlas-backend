import { Request, Response } from 'express';
import { prisma } from '../../shared/db/prisma';
import { redisCache, redisQueue } from '../../shared/redis/redis';
import { env } from '../../shared/config/env';

interface HealthStatus {
  status: 'OK' | 'ERROR';
  timestamp: string;
  environment: string;
  services: {
    database: 'CONNECTED' | 'DISCONNECTED' | 'UNKNOWN';
    redis_cache: 'CONNECTED' | 'DISCONNECTED' | 'UNKNOWN';
    redis_queue: 'CONNECTED' | 'DISCONNECTED' | 'UNKNOWN';
  };
}

export class HealthController {
  async check(req: Request, res: Response) {
    res.status(200).json({ status: 'OK', timestamp: new Date().toISOString() });
  }

  async ready(req: Request, res: Response) {
    const health: HealthStatus = {
      status: 'OK',
      timestamp: new Date().toISOString(),
      environment: env.NODE_ENV,
      services: {
        database: 'UNKNOWN',
        redis_cache: 'UNKNOWN',
        redis_queue: 'UNKNOWN',
      },
    };

    let hasError = false;

    // Check Database
    try {
      await prisma.$queryRaw`SELECT 1`;
      health.services.database = 'CONNECTED';
    } catch (error) {
      health.services.database = 'DISCONNECTED';
      health.status = 'ERROR';
      hasError = true;
    }

    // Check Redis Cache
    try {
      const redisStatus = await redisCache.ping();
      health.services.redis_cache = redisStatus === 'PONG' ? 'CONNECTED' : 'DISCONNECTED';
      if (redisStatus !== 'PONG') {
        health.status = 'ERROR';
        hasError = true;
      }
    } catch (error) {
      health.services.redis_cache = 'DISCONNECTED';
      health.status = 'ERROR';
      hasError = true;
    }

    // Check Redis Queue
    try {
      const redisStatus = await redisQueue.ping();
      health.services.redis_queue = redisStatus === 'PONG' ? 'CONNECTED' : 'DISCONNECTED';
      if (redisStatus !== 'PONG') {
        health.status = 'ERROR';
        hasError = true;
      }
    } catch (error) {
      health.services.redis_queue = 'DISCONNECTED';
      health.status = 'ERROR';
      hasError = true;
    }

    res.status(hasError ? 503 : 200).json(health);
  }
}
