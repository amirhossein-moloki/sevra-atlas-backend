import { Request, Response, NextFunction } from 'express';
import { CacheService } from '../redis/cache.service';
import { logger } from '../logger/logger';

interface CacheOptions {
  ttl: number;
  staleWhileRevalidate?: number;
  keyPrefix?: string;
}

export const cacheMiddleware = (options: CacheOptions) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    // Only cache GET requests
    if (req.method !== 'GET') {
      return next();
    }

    // Skip cache if Authorization header is present (private data)
    if (req.headers.authorization) {
      return next();
    }

    const key = options.keyPrefix
      ? `${options.keyPrefix}:${req.originalUrl}`
      : `http:${req.originalUrl}`;

    try {
      const cachedResponse = await CacheService.get<any>(key);

      if (cachedResponse) {
        res.setHeader('X-Cache', 'HIT');
        res.setHeader('Cache-Control', `public, max-age=${options.ttl}`);
        return res.json(cachedResponse);
      }

      // If not cached, wrap res.json to capture the response
      res.setHeader('X-Cache', 'MISS');
      const originalJson = res.json.bind(res);

      res.json = (body: any) => {
        // Only cache successful responses
        if (res.statusCode >= 200 && res.statusCode < 300) {
          CacheService.set(key, body, options.ttl).catch(err =>
            logger.error(`Failed to cache response for ${key}`, err)
          );
        }
        return originalJson(body);
      };

      next();
    } catch (error) {
      logger.error('Cache middleware error:', error);
      next();
    }
  };
};
