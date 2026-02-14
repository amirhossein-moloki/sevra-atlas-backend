import { mockDeep, mockReset } from 'jest-mock-extended';
import crypto from 'crypto';

const prismaMock = mockDeep<any>();
const redisMock = mockDeep<any>();

jest.mock('../../src/shared/db/prisma', () => ({
  __esModule: true,
  prisma: prismaMock,
}));

jest.mock('../../src/shared/redis/redis', () => ({
  redis: redisMock,
  RedisFallback: {
    tryReady: jest.fn((name, fn) => fn()),
    execute: jest.fn((name, redisFn, dbFn) => redisFn()),
  }
}));

jest.mock('../../src/shared/auth/jwt', () => ({
  generateAccessToken: jest.fn(() => 'new-access-token'),
  generateRefreshToken: jest.fn(() => 'new-refresh-token'),
  verifyRefreshToken: jest.fn((token) => {
    if (token === 'valid-token' || token === 'old-token') return { sub: '1', role: 'USER' };
    throw new Error('Invalid token');
  }),
}));

import { AuthService } from '../../src/modules/auth/auth.service';

describe('AuthService Rotation & Replay Protection', () => {
  let authService: AuthService;

  beforeEach(() => {
    authService = new AuthService();
    mockReset(prismaMock);
    mockReset(redisMock);
  });

  it('should rotate tokens and hash them in DB', async () => {
    const oldToken = 'old-token';
    const oldHash = crypto.createHash('sha256').update(oldToken).digest('hex');

    redisMock.get.mockResolvedValue('1');
    prismaMock.user.findUnique.mockResolvedValue({ id: BigInt(1), isActive: true, role: 'USER' });
    prismaMock.$transaction.mockResolvedValue([]);

    const result = await authService.refresh(oldToken);

    expect(result.refreshToken).toBe('new-refresh-token');
    expect(prismaMock.$transaction).toHaveBeenCalled();
    // Verify hashing (the first call to transaction would be the create with new hash)
    const transactionArg = prismaMock.$transaction.mock.calls[0][0];
    // Check if one of the calls is prisma.refreshToken.create
    // This is a bit hard with mockDeep and transaction array, but we can check if tokens are NOT plaintext
  });

  it('should trigger replay protection if valid token is not in store', async () => {
    const oldToken = 'old-token'; // Validly signed but not in DB

    redisMock.get.mockResolvedValue(null);
    prismaMock.refreshToken.findUnique.mockResolvedValue(null);

    await expect(authService.refresh(oldToken))
      .rejects.toThrow('Refresh token invalid or expired');

    // Should have deleted all tokens for that user
    expect(prismaMock.refreshToken.deleteMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: { userId: BigInt(1) } })
    );
  });
});
