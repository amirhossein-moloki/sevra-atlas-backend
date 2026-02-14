import Redis from 'ioredis';
import { config } from '../../config';
import { logger } from '../logger/logger';

const redisConfig = {
  maxRetriesPerRequest: null, // Required by BullMQ
  enableOfflineQueue: true,
  connectTimeout: 5000,
};

// Cache Redis (Used for generic caching, rate limiting)
export const redisCache = new Redis(config.redis.url, {
  ...redisConfig,
  password: config.redis.password,
  maxRetriesPerRequest: 1,
  enableOfflineQueue: false,
});

// Queue Redis (Dedicated for BullMQ)
export const redisQueue = new Redis(config.redis.queueUrl, {
  ...redisConfig,
  password: config.redis.password,
});

redisCache.on('connect', () => logger.info('Connected to Redis Cache'));
redisCache.on('error', (err) => logger.error('Redis Cache error', err));

redisQueue.on('connect', () => logger.info('Connected to Redis Queue'));
redisQueue.on('error', (err) => logger.error('Redis Queue error', err));

// Deprecated export for backward compatibility during migration
export const redis = redisCache;

export const closeRedisConnections = async () => {
  try {
    await redisCache.quit();
    await redisQueue.quit();
  } catch (error) {
    // Ignore errors during closing
  }
};
