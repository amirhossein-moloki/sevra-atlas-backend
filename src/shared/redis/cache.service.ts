import { redisCache as redis } from './redis';
import { logger } from '../logger/logger';

export class CacheService {
  private static PREFIX = 'sevra:cache:v1:';

  static async get<T>(key: string): Promise<T | null> {
    try {
      const data = await redis.get(this.PREFIX + key);
      if (!data) return null;
      return JSON.parse(data, this.reviver);
    } catch (error) {
      logger.error(`Cache get error for key ${key}:`, error);
      return null;
    }
  }

  static async set(key: string, value: any, ttlSeconds: number): Promise<void> {
    try {
      const serialized = JSON.stringify(value, this.replacer);
      const jitteredTtl = this.getJitteredTtl(ttlSeconds);
      await redis.set(this.PREFIX + key, serialized, 'EX', jitteredTtl);
    } catch (error) {
      logger.error(`Cache set error for key ${key}:`, error);
    }
  }

  static async del(key: string): Promise<void> {
    try {
      await redis.del(this.PREFIX + key);
    } catch (error) {
      logger.error(`Cache del error for key ${key}:`, error);
    }
  }

  static async delByPattern(pattern: string): Promise<void> {
    try {
      const keys = await redis.keys(this.PREFIX + pattern);
      if (keys.length > 0) {
        await redis.del(...keys);
      }
    } catch (error) {
      logger.error(`Cache delByPattern error for pattern ${pattern}:`, error);
    }
  }

  /**
   * Wraps a function with caching logic.
   * Supports stale-while-revalidate and basic stampede protection.
   */
  static async wrap<T>(
    key: string,
    fn: () => Promise<T>,
    ttlSeconds: number,
    options: { staleWhileRevalidate?: number } = {}
  ): Promise<T> {
    const cached = await this.get<{ data: T; expiresAt: number }>(key);
    const now = Date.now();

    if (cached) {
      const isStale = now > cached.expiresAt;
      if (!isStale) {
        return cached.data;
      }

      // If stale but within stale-while-revalidate window
      if (options.staleWhileRevalidate && now < cached.expiresAt + (options.staleWhileRevalidate * 1000)) {
        // Background revalidation
        this.backgroundRevalidate(key, fn, ttlSeconds);
        return cached.data;
      }
    }

    // Cache miss or fully expired - Stampede protection using a lock
    const lockKey = `lock:${key}`;
    const acquired = await redis.set(this.PREFIX + lockKey, '1', 'EX', 10, 'NX');

    if (!acquired) {
      // Someone else is fetching, wait a bit and try cache again
      await new Promise(resolve => setTimeout(resolve, 200));
      return this.wrap(key, fn, ttlSeconds, options);
    }

    try {
      const freshData = await fn();
      await this.set(key, { data: freshData, expiresAt: now + (ttlSeconds * 1000) }, ttlSeconds + (options.staleWhileRevalidate || 0));
      return freshData;
    } finally {
      await redis.del(this.PREFIX + lockKey);
    }
  }

  private static getJitteredTtl(ttl: number): number {
    const jitterPercent = 0.15; // 15% jitter
    const jitterAmount = Math.floor(ttl * jitterPercent);
    const min = ttl - jitterAmount;
    const max = ttl + jitterAmount;
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }

  private static async backgroundRevalidate<T>(key: string, fn: () => Promise<T>, ttlSeconds: number) {
    const lockKey = `lock:bg:${key}`;
    const acquired = await redis.set(this.PREFIX + lockKey, '1', 'EX', 30, 'NX');
    if (!acquired) return;

    try {
      const freshData = await fn();
      await this.set(key, { data: freshData, expiresAt: Date.now() + (ttlSeconds * 1000) }, ttlSeconds * 2);
    } catch (error) {
      logger.error(`Background revalidation failed for ${key}`, error);
    } finally {
      await redis.del(this.PREFIX + lockKey);
    }
  }

  private static replacer(_key: string, value: any) {
    if (typeof value === 'bigint') {
      return { _type: 'BigInt', value: value.toString() };
    }
    if (value instanceof Date) {
      return { _type: 'Date', value: value.toISOString() };
    }
    return value;
  }

  private static reviver(_key: string, value: any) {
    if (value && typeof value === 'object' && value._type === 'BigInt') {
      return BigInt(value.value);
    }
    if (value && typeof value === 'object' && value._type === 'Date') {
      return new Date(value.value);
    }
    return value;
  }
}
