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
    if (
      process.env.ENABLE_RATE_LIMIT === 'false' ||
      process.env.NODE_ENV === 'test' ||
      process.env.SANDBOX_MODE === 'true'
    ) {
      return next();
    }

    // Bypass for whitelisted IPs or bypass token
    const whitelist = process.env.RATE_LIMIT_WHITELIST_IPS?.split(',') || [];
    const bypassToken = process.env.RATE_LIMIT_BYPASS_TOKEN;

    if (
      (req.ip && whitelist.includes(req.ip)) ||
      (bypassToken && req.headers['x-rate-limit-bypass'] === bypassToken)
    ) {
      return next();
    }

    const key = keyGenerator ? keyGenerator(req) : req.ip;
    const redisKey = `ratelimit:${prefix}:${key}`;

    try {
      const current = await redis.incr(redisKey);
      if (current === 1) {
        await redis.expire(redisKey, windowSeconds);
      }

      if (current > limit) {
        const error = new ApiError(429, 'Too many requests, please try again later');
        error.code = 'TOO_MANY_REQUESTS';
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
