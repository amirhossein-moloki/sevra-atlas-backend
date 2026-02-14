import { Request, Response, NextFunction } from 'express';
import { redis } from '../redis/redis';
import { ApiError } from '../errors/ApiError';
import { logger } from '../logger/logger';

export const rateLimit = (
  prefix: string,
  limit: number,
  windowSeconds: number,
  keyGenerator?: (req: Request) => string
) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    const key = keyGenerator ? keyGenerator(req) : req.ip;
    const redisKey = `ratelimit:${prefix}:${key}`;

    try {
      const current = await redis.incr(redisKey);
      if (current === 1) {
        await redis.expire(redisKey, windowSeconds);
      }

      if (current > limit) {
        const error = new ApiError(429, 'Too many requests, please try again later');
        (error as any).code = 'TOO_MANY_REQUESTS';
        throw error;
      }
    } catch (error) {
      if (error instanceof ApiError) {
        return next(error);
      }
      logger.warn(`Rate limit check failed due to Redis error (fail-open):`, error);
    }

    next();
  };
};
