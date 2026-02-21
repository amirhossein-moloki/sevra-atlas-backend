import { Request, Response, NextFunction } from 'express';
import { redis } from '../redis/redis';
import { ApiError } from '../errors/ApiError';
import { logger } from '../logger/logger';
import { config } from '../../config';

/**
 * Rate limiting middleware using Redis.
 * Enforces request limits per IP or custom key.
 */
export const rateLimit = (
  prefix: string,
  limit: number,
  windowSeconds: number,
  keyGenerator?: (req: Request) => string
) => {
  return async (req: Request, _res: Response, next: NextFunction) => {
    // Bypass in test/sandbox or if explicitly disabled
    const isTest = process.env.NODE_ENV === 'test' || config.isTest;
    const isSandbox = process.env.SANDBOX_MODE === 'true' || config.sandboxMode;

    // Explicitly enabled takes precedence for testing the middleware itself
    const isExplicitlyEnabled = process.env.ENABLE_RATE_LIMIT === 'true';
    const isExplicitlyDisabled =
      process.env.ENABLE_RATE_LIMIT === 'false' ||
      process.env.RATE_LIMIT_ENABLED === 'false';

    if (!isExplicitlyEnabled && (isTest || isSandbox || isExplicitlyDisabled)) {
      return next();
    }

    // Bypass for whitelisted IPs or bypass token
    const whitelist = process.env.RATE_LIMIT_WHITELIST_IPS?.split(',') || [];
    const bypassToken = process.env.RATE_LIMIT_BYPASS_TOKEN;

    if (
      req.method === 'OPTIONS' ||
      (req.ip && whitelist.includes(req.ip)) ||
      (bypassToken &&
        (req.headers['x-rate-limit-bypass'] === bypassToken ||
          req.headers['x-rate-limit-bypass-token'] === bypassToken))
    ) {
      return next();
    }

    const key = keyGenerator ? keyGenerator(req) : req.ip;
    const redisKey = `ratelimit:${prefix}:${key}`;

    try {
      // Use pipeline for atomic increment and expire if needed
      const current = await redis.incr(redisKey);
      if (current === 1) {
        await redis.expire(redisKey, windowSeconds);
      }

      if (current > limit) {
        logger.warn(`Rate limit exceeded for key: ${redisKey} (${current}/${limit})`);
        const error = new ApiError(429, 'Too many requests, please try again later');
        error.code = 'TOO_MANY_REQUESTS';
        return next(error);
      }
    } catch (error) {
      if (error instanceof ApiError) {
        return next(error);
      }
      // Fail-open strategy to prevent Redis outages from blocking legitimate users
      logger.error(`Rate limit check failed due to Redis error (fail-open):`, error);
    }

    next();
  };
};
