import { prisma } from '../../shared/db/prisma';
import { redis } from '../../shared/redis/redis';
import { RedisFallback } from '../../shared/redis/redis-fallback';
import { env } from '../../shared/config/env';
import { smsProvider } from '../../shared/utils/sms';
import { ApiError } from '../../shared/errors/ApiError';
import { generateAccessToken, generateRefreshToken, verifyRefreshToken } from '../../shared/auth/jwt';
import { UserRole } from '@prisma/client';
import { logger } from '../../shared/logger/logger';

export class AuthService {
  async requestOtp(phoneNumber: string, ip?: string, userAgent?: string) {
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    const redisKey = `otp:${phoneNumber}`;
    const expiresAt = new Date(Date.now() + env.OTP_TTL_SECONDS * 1000);

    // Use Redis with DB fallback
    await RedisFallback.execute(
      'requestOtp',
      async () => {
        await redis.set(redisKey, code, 'EX', env.OTP_TTL_SECONDS);
        await redis.set(`${redisKey}:attempts`, 0, 'EX', env.OTP_TTL_SECONDS);
        // Also clear any DB fallback record to keep it clean if Redis is working
        await prisma.otp.deleteMany({ where: { phoneE164: phoneNumber } });
      },
      async () => {
        await prisma.otp.upsert({
          where: { phoneE164: phoneNumber },
          update: { code, expiresAt, attempts: 0 },
          create: { phoneE164: phoneNumber, code, expiresAt, attempts: 0 },
        });
      }
    );

    await smsProvider.sendOtp(phoneNumber, code);

    await prisma.otpAttempt.create({
      data: { phoneE164: phoneNumber, ip, userAgent, purpose: 'LOGIN', success: false },
    });

    return { message: 'OTP sent successfully' };
  }

  async verifyOtp(phoneNumber: string, code: string, ip?: string, userAgent?: string) {
    const redisKey = `otp:${phoneNumber}`;
    let storedCode: string | null = null;
    let attempts = 0;
    let source: 'redis' | 'db' = 'redis';

    try {
      storedCode = await redis.get(redisKey);
      attempts = parseInt((await redis.get(`${redisKey}:attempts`)) || '0');
    } catch (error) {
      logger.error('Redis error in verifyOtp, falling back to DB', error);
      source = 'db';
    }

    // If not found in Redis or Redis failed, check DB
    if (!storedCode) {
      const otpRecord = await prisma.otp.findUnique({ where: { phoneE164: phoneNumber } });
      if (otpRecord && otpRecord.expiresAt > new Date()) {
        storedCode = otpRecord.code;
        attempts = otpRecord.attempts;
        source = 'db';
      }
    }

    if (!storedCode) {
      throw new ApiError(400, 'OTP expired or not requested');
    }

    if (attempts >= env.OTP_MAX_ATTEMPTS) {
      throw new ApiError(400, 'Too many failed attempts');
    }

    if (storedCode !== code) {
      if (source === 'redis') {
        await RedisFallback.tryReady('incrAttempts', () => redis.incr(`${redisKey}:attempts`), 0);
      } else {
        await prisma.otp.update({
          where: { phoneE164: phoneNumber },
          data: { attempts: { increment: 1 } },
        });
      }

      await prisma.otpAttempt.create({
        data: { phoneE164: phoneNumber, ip, userAgent, purpose: 'VERIFY', success: false },
      });
      throw new ApiError(400, 'Invalid OTP');
    }

    // Success - clean up
    if (source === 'redis') {
      await RedisFallback.tryReady('delOtp', async () => {
        await redis.del(redisKey);
        await redis.del(`${redisKey}:attempts`);
      }, null);
    } else {
      await prisma.otp.deleteMany({ where: { phoneE164: phoneNumber } });
    }

    let user = await prisma.user.findUnique({
      where: { phoneNumber },
    });

    if (!user) {
      user = await prisma.user.create({
        data: {
          phoneNumber,
          username: `user_${Date.now()}`,
          firstName: '',
          lastName: '',
          email: '',
          isStaff: false,
          isActive: true,
          isPhoneVerified: true,
          role: UserRole.USER,
          referralCode: Math.random().toString(36).substring(2, 10),
        },
      });
    }

    await prisma.otpAttempt.create({
      data: { phoneE164: phoneNumber, ip, userAgent, purpose: 'VERIFY', success: true, userId: user.id },
    });

    const payload = { sub: user.id.toString(), role: user.role };
    const accessToken = generateAccessToken(payload);
    const refreshToken = generateRefreshToken(payload);

    // Store refresh token in Redis AND DB for fallback
    const expiresAt = new Date(Date.now() + env.JWT_REFRESH_TTL * 1000);

    await RedisFallback.tryReady(
      'storeRefreshToken',
      () => redis.set(`refresh_token:${user!.id}:${refreshToken}`, '1', 'EX', env.JWT_REFRESH_TTL),
      null
    );

    await prisma.refreshToken.create({
      data: {
        userId: user.id,
        token: refreshToken,
        expiresAt,
      },
    });

    return {
      accessToken,
      refreshToken,
      user: {
        id: user.id.toString(),
        phoneNumber: user.phoneNumber,
        role: user.role,
      },
    };
  }

  async refresh(refreshToken: string) {
    try {
      const payload = verifyRefreshToken(refreshToken);
      const redisKey = `refresh_token:${payload.sub}:${refreshToken}`;

      let exists = false;

      try {
        const val = await redis.get(redisKey);
        exists = !!val;
      } catch (error) {
        logger.error('Redis error in refresh, falling back to DB', error);
      }

      // If not in Redis or Redis failed, check DB
      if (!exists) {
        const tokenRecord = await prisma.refreshToken.findUnique({
          where: { token: refreshToken },
        });
        exists = !!tokenRecord && tokenRecord.expiresAt > new Date();
      }

      if (!exists) {
        throw new ApiError(401, 'Refresh token invalid or expired');
      }

      const newAccessToken = generateAccessToken({ sub: payload.sub, role: payload.role });
      return { accessToken: newAccessToken, expiresIn: env.JWT_ACCESS_TTL };
    } catch (error) {
      if (error instanceof ApiError) throw error;
      throw new ApiError(401, 'Invalid refresh token');
    }
  }

  async logout(userId: string, refreshToken: string) {
    const redisKey = `refresh_token:${userId}:${refreshToken}`;

    await RedisFallback.tryReady('logoutRedis', () => redis.del(redisKey), null);
    await prisma.refreshToken.deleteMany({
      where: { token: refreshToken },
    });

    return { ok: true };
  }
}
