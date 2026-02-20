import { Request, Response, NextFunction } from 'express';
import { redis } from '../redis/redis';
import { ApiError } from '../errors/ApiError';
import { logger } from '../logger/logger';
import { config } from '../../config';

export const rateLimit = (
  prefix: string,
  limit: number,
  windowSeconds: number,
  keyGenerator?: (req: Request) => string
) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    // Bypass in test/sandbox or if explicitly disabled
    const isTest = process.env.NODE_ENV === 'test' || config.isTest;
    const isSandbox = process.env.SANDBOX_MODE === 'true' || config.sandboxMode;

    // Explicitly enabled takes precedence for testing the middleware itself
    const isExplicitlyEnabled = process.env.ENABLE_RATE_LIMIT === 'true';
    const isExplicitlyDisabled =
      process.env.ENABLE_RATE_LIMIT === 'false' ||
      process.env.RATE_LIMIT_ENABLED === 'false';

    if (!isExplicitlyEnabled && (isTest || isSandbox || isExplicitlyDisabled)) {
      logger.debug(`Rate limit bypassed: isTest=${isTest}, isSandbox=${isSandbox}, isExplicitlyDisabled=${isExplicitlyDisabled}`);
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
