import Redis from 'ioredis';
import { env } from '../config/env';
import { logger } from '../logger/logger';

export const redis = new Redis(env.REDIS_URL);

redis.on('connect', () => {
  logger.info('Connected to Redis');
});

redis.on('error', (err) => {
  logger.error('Redis error', err);
});
