import { rateLimit } from '../src/shared/middlewares/rateLimit.middleware';
import { redis } from '../src/shared/redis/redis';
import { Request, Response } from 'express';

jest.mock('../src/shared/redis/redis', () => ({
  redis: {
    incr: jest.fn(),
    expire: jest.fn(),
  },
}));

describe('RateLimit Middleware Fallback', () => {
  it('should call next() even if Redis fails (fail-open)', async () => {
    (redis.incr as jest.Mock).mockRejectedValue(new Error('Redis down'));

    const req = { ip: '127.0.0.1' } as Request;
    const res = {} as Response;
    const next = jest.fn();

    const middleware = rateLimit('test', 10, 60);
    await middleware(req, res, next);

    expect(next).toHaveBeenCalled();
    expect(next).not.toHaveBeenCalledWith(expect.any(Error));
  });

  it('should throw 429 if limit exceeded and Redis is working', async () => {
    (redis.incr as jest.Mock).mockResolvedValue(11);

    const req = { ip: '127.0.0.1' } as Request;
    const res = {} as Response;
    const next = jest.fn();

    const middleware = rateLimit('test', 10, 60);
    await middleware(req, res, next);

    expect(next).toHaveBeenCalledWith(expect.objectContaining({ statusCode: 429 }));
  });
});
