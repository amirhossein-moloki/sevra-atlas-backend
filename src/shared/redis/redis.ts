import Redis from 'ioredis';
import { env } from '../config/env';
import { logger } from '../logger/logger';

const redisConfig = {
  maxRetriesPerRequest: null, // Required by BullMQ
  enableOfflineQueue: true,
  connectTimeout: 5000,
};

// Cache Redis (Used for generic caching, rate limiting)
export const redisCache = new Redis(env.REDIS_URL, {
  ...redisConfig,
  maxRetriesPerRequest: 1,
  enableOfflineQueue: false,
});

// Queue Redis (Dedicated for BullMQ)
export const redisQueue = new Redis(env.REDIS_QUEUE_URL || env.REDIS_URL, {
  ...redisConfig,
});

redisCache.on('connect', () => logger.info('Connected to Redis Cache'));
redisCache.on('error', (err) => logger.error('Redis Cache error', err));

redisQueue.on('connect', () => logger.info('Connected to Redis Queue'));
redisQueue.on('error', (err) => logger.error('Redis Queue error', err));

// Deprecated export for backward compatibility during migration
export const redis = redisCache;
