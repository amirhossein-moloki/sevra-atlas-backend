import Redis from 'ioredis';
import { createClient } from 'redis';
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
  enableOfflineQueue: true, // Allow queuing during short blips or startup
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

/**
 * Dedicated node-redis client for express-session/connect-redis.
 * connect-redis v7+ works best with node-redis or ioredis, but node-redis is more stable
 * for session management in some environments.
 */
export const redisSession = createClient({
  url: config.redis.url,
  password: config.redis.password,
});

redisSession.on('error', (err) => logger.error('Redis Session Error', err));
redisSession.connect().catch((err) => logger.error('Redis Session Connection Error', err));

// Deprecated export for backward compatibility during migration
export const redis = redisCache;

export const closeRedisConnections = async (force = false) => {
  try {
    if (force) {
      redisCache.disconnect();
      redisQueue.disconnect();
      await redisSession.disconnect();
    } else {
      await Promise.all([
        redisCache.quit(),
        redisQueue.quit(),
        redisSession.quit()
      ]);
    }
  } catch (_error) {
    // Ignore errors during closing
  }
};
