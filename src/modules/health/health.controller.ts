import { Request, Response } from 'express';
import { prisma } from '../../shared/db/prisma';
import { redis } from '../../shared/redis/redis';
import { env } from '../../shared/config/env';

interface HealthStatus {
  status: 'OK' | 'ERROR';
  timestamp: string;
  environment: string;
  services: {
    database: 'CONNECTED' | 'DISCONNECTED' | 'UNKNOWN';
    redis: 'CONNECTED' | 'DISCONNECTED' | 'UNHEALTHY' | 'UNKNOWN';
  };
}

export class HealthController {
  async check(req: Request, res: Response) {
    const health: HealthStatus = {
      status: 'OK',
      timestamp: new Date().toISOString(),
      environment: env.NODE_ENV,
      services: {
        database: 'UNKNOWN',
        redis: 'UNKNOWN',
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

    // Check Redis
    try {
      const redisStatus = await redis.ping();
      if (redisStatus === 'PONG') {
        health.services.redis = 'CONNECTED';
      } else {
        health.services.redis = 'UNHEALTHY';
        health.status = 'ERROR';
        hasError = true;
      }
    } catch (error) {
      health.services.redis = 'DISCONNECTED';
      health.status = 'ERROR';
      hasError = true;
    }

    res.status(hasError ? 503 : 200).json(health);
  }
}
