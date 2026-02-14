import { AuthService } from '../src/modules/auth/auth.service';
import { redis } from '../src/shared/redis/redis';
import { prisma } from '../src/shared/db/prisma';
import crypto from 'crypto';

jest.mock('../src/shared/redis/redis', () => ({
  redis: {
    get: jest.fn(),
    set: jest.fn(),
    del: jest.fn(),
    incr: jest.fn(),
  },
}));

jest.mock('../src/shared/db/prisma', () => ({
  prisma: {
    otp: {
      upsert: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
      deleteMany: jest.fn(),
    },
    otpAttempt: {
      create: jest.fn(),
    },
    user: {
      findUnique: jest.fn(),
      create: jest.fn(),
    },
    refreshToken: {
      create: jest.fn(),
      findUnique: jest.fn(),
      deleteMany: jest.fn(),
    },
    $transaction: jest.fn((promises) => Promise.all(promises)),
  },
}));

// Mock SMS provider to avoid real SMS sending
jest.mock('../src/shared/utils/sms', () => ({
  smsProvider: {
    sendOtp: jest.fn().mockResolvedValue({}),
  },
}));

// Mock JWT module
jest.mock('../src/shared/auth/jwt', () => ({
  generateAccessToken: jest.fn().mockReturnValue('mock_access_token'),
  generateRefreshToken: jest.fn().mockReturnValue('mock_refresh_token'),
  verifyRefreshToken: jest.fn().mockReturnValue({ sub: '1', role: 'USER' }),
}));

describe('AuthService Fallback', () => {
  let authService: AuthService;

  beforeEach(() => {
    jest.clearAllMocks();
    authService = new AuthService();
  });

  it('should fallback to DB when Redis fails during OTP request', async () => {
    (redis.set as jest.Mock).mockRejectedValue(new Error('Redis down'));
    (prisma.otp.upsert as jest.Mock).mockResolvedValue({});

    await authService.requestOtp('+989123456789');

    expect(redis.set).toHaveBeenCalled();
    expect(prisma.otp.upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { phoneE164: '+989123456789' },
      })
    );
  });

  it('should fallback to DB when Redis fails during OTP verification', async () => {
    (redis.get as jest.Mock).mockRejectedValue(new Error('Redis down'));
    (prisma.otp.findUnique as jest.Mock).mockResolvedValue({
      code: '123456',
      expiresAt: new Date(Date.now() + 10000),
      attempts: 0,
    });
    (prisma.user.findUnique as jest.Mock).mockResolvedValue({
      id: BigInt(1),
      phoneNumber: '+989123456789',
      role: 'USER',
    });
    (prisma.refreshToken.create as jest.Mock).mockResolvedValue({});

    const result = await authService.verifyOtp('+989123456789', '123456');

    expect(result.accessToken).toBeDefined();
    expect(prisma.otp.findUnique).toHaveBeenCalled();
  });

  it('should fallback to DB when Redis fails during Token Refresh', async () => {
    (redis.get as jest.Mock).mockRejectedValue(new Error('Redis down'));
    const token = 'some_token';
    const tokenHash = crypto.createHash('sha256').update(token).digest('hex');

    (prisma.refreshToken.findUnique as jest.Mock).mockResolvedValue({
      token: tokenHash,
      expiresAt: new Date(Date.now() + 10000),
      userId: BigInt(1),
    });
    (prisma.user.findUnique as jest.Mock).mockResolvedValue({
      id: BigInt(1),
      isActive: true,
      role: 'USER',
    });

    const result = await authService.refresh(token);

    expect(result.accessToken).toBe('mock_access_token');
    expect(prisma.refreshToken.findUnique).toHaveBeenCalledWith({
      where: { token: tokenHash }
    });
  });

  it('should fallback to DB during logout', async () => {
    (redis.del as jest.Mock).mockRejectedValue(new Error('Redis down'));
    const token = 'some_token';
    const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
    (prisma.refreshToken.deleteMany as jest.Mock).mockResolvedValue({ count: 1 });

    await authService.logout('1', token);

    expect(redis.del).toHaveBeenCalled();
    expect(prisma.refreshToken.deleteMany).toHaveBeenCalledWith({
      where: { token: tokenHash }
    });
  });
});
