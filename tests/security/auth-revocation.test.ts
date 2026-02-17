import { mockDeep, mockReset } from 'jest-mock-extended';
import { ApiError } from '../../src/shared/errors/ApiError';

const prismaMock = mockDeep<any>();
const redisMock = mockDeep<any>();

jest.mock('../../src/shared/db/prisma', () => ({
  __esModule: true,
  prisma: prismaMock,
}));

jest.mock('../../src/shared/redis/redis', () => ({
  redisCache: redisMock,
  redis: redisMock,
  RedisFallback: {
    tryReady: jest.fn((name, fn) => fn()),
    execute: jest.fn((name, redisFn, dbFn) => redisFn()),
  }
}));

jest.mock('../../src/shared/auth/jwt', () => ({
  verifyAccessToken: jest.fn((token) => {
    if (token === 'revoked-token') return { sub: '1', role: 'USER', v: 1 };
    if (token === 'valid-token') return { sub: '1', role: 'USER', v: 2 };
    throw new Error('Invalid token');
  }),
}));

import { requireAuth } from '../../src/shared/middlewares/auth.middleware';

describe('Auth Revocation Middleware', () => {
  let middleware: any;

  beforeEach(() => {
    middleware = requireAuth();
    mockReset(prismaMock);
    mockReset(redisMock);
  });

  it('should reject token with older version than in Redis', async () => {
    const req = {
      headers: { authorization: 'Bearer revoked-token' }
    };
    const res = {};
    const next = jest.fn();

    // Redis has version 2
    redisMock.get.mockResolvedValue('2');

    await middleware(req, res, next);

    expect(next).toHaveBeenCalledWith(expect.any(ApiError));
    const error = next.mock.calls[0][0];
    expect(error.statusCode).toBe(401);
    expect(error.message).toBe('Token has been revoked');
  });

  it('should accept token with current version', async () => {
    const req = {
      headers: { authorization: 'Bearer valid-token' }
    };
    const res = {};
    const next = jest.fn();

    // Redis has version 2
    redisMock.get.mockResolvedValue('2');
    prismaMock.user.findUnique.mockResolvedValue({ id: BigInt(1), role: 'USER', isActive: true });

    await middleware(req, res, next);

    expect(next).toHaveBeenCalledWith();
    expect((req as any).user.id).toBe(BigInt(1));
  });
});
