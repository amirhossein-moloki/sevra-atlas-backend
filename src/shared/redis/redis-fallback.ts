import { redis } from './redis';
import { logger } from '../logger/logger';

export class RedisFallback {
  /**
   * Executes a Redis operation with a fallback to a secondary operation (e.g., Database)
   * if Redis is unavailable or fails.
   */
  static async execute<T>(
    operationName: string,
    redisOp: () => Promise<T>,
    fallbackOp: () => Promise<T>
  ): Promise<T> {
    try {
      return await redisOp();
    } catch (error) {
      logger.error(`Redis error during "${operationName}", falling back to secondary store:`, error);
      return await fallbackOp();
    }
  }

  /**
   * Tries a Redis operation but doesn't throw if it fails (Best effort).
   * Useful for non-critical paths like rate limiting (fail-open).
   */
  static async tryReady<T>(
    operationName: string,
    redisOp: () => Promise<T>,
    defaultValue: T
  ): Promise<T> {
    try {
      return await redisOp();
    } catch (error) {
      logger.warn(`Redis error during non-critical operation "${operationName}":`, error);
      return defaultValue;
    }
  }
}
