import { Request, Response, NextFunction } from 'express';
import { redis } from '../redis/redis';
import { ApiError } from '../errors/ApiError';
import { env } from '../config/env';

export const rateLimit = (
  prefix: string,
  limit: number,
  windowSeconds: number,
  keyGenerator?: (req: Request) => string
) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    const key = keyGenerator ? keyGenerator(req) : req.ip;
    const redisKey = `ratelimit:${prefix}:${key}`;

    const current = await redis.incr(redisKey);
    if (current === 1) {
      await redis.expire(redisKey, windowSeconds);
    }

    if (current > limit) {
      throw new ApiError(429, 'Too many requests, please try again later');
    }

    next();
  };
};
