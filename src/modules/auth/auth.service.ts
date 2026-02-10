import { prisma } from '../../shared/db/prisma';
import { redis } from '../../shared/redis/redis';
import { env } from '../../shared/config/env';
import { smsProvider } from '../../shared/utils/sms';
import { ApiError } from '../../shared/errors/ApiError';
import { generateAccessToken, generateRefreshToken, verifyRefreshToken } from '../../shared/auth/jwt';
import { UserRole } from '@prisma/client';

export class AuthService {
  async requestOtp(phoneNumber: string, ip?: string, userAgent?: string) {
    // 1. Generate 6-digit code
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    
    // 2. Store in Redis with TTL
    const redisKey = `otp:${phoneNumber}`;
    await redis.set(redisKey, code, 'EX', env.OTP_TTL_SECONDS);
    await redis.set(`${redisKey}:attempts`, 0, 'EX', env.OTP_TTL_SECONDS);

    // 3. Send via SMS
    await smsProvider.sendOtp(phoneNumber, code);

    // 4. Log attempt (pending)
    await prisma.otpAttempt.create({
      data: {
        phoneE164: phoneNumber,
        ip,
        userAgent,
        purpose: 'LOGIN',
        success: false,
      },
    });

    return { message: 'OTP sent successfully' };
  }

  async verifyOtp(phoneNumber: string, code: string, ip?: string, userAgent?: string) {
    const redisKey = `otp:${phoneNumber}`;
    const storedCode = await redis.get(redisKey);
    const attempts = await redis.get(`${redisKey}:attempts`);

    if (!storedCode) {
      throw new ApiError(400, 'OTP expired or not requested');
    }

    if (parseInt(attempts || '0') >= env.OTP_MAX_ATTEMPTS) {
      throw new ApiError(400, 'Too many failed attempts');
    }

    if (storedCode !== code) {
      await redis.incr(`${redisKey}:attempts`);
      await prisma.otpAttempt.create({
        data: { phoneE164: phoneNumber, ip, userAgent, purpose: 'VERIFY', success: false },
      });
      throw new ApiError(400, 'Invalid OTP');
    }

    // Success
    await redis.del(redisKey);
    await redis.del(`${redisKey}:attempts`);

    let user = await prisma.user.findUnique({
      where: { phoneNumber },
    });

    if (!user) {
      // Create user if not exists
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

    // Store refresh token in Redis for rotation/invalidation
    await redis.set(`refresh_token:${user.id}:${refreshToken}`, '1', 'EX', env.JWT_REFRESH_TTL);

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
      const exists = await redis.get(`refresh_token:${payload.sub}:${refreshToken}`);

      if (!exists) {
        throw new ApiError(401, 'Refresh token invalid or expired');
      }

      const newAccessToken = generateAccessToken({ sub: payload.sub, role: payload.role });
      return { accessToken: newAccessToken, expiresIn: env.JWT_ACCESS_TTL };
    } catch (error) {
      throw new ApiError(401, 'Invalid refresh token');
    }
  }

  async logout(userId: string, refreshToken: string) {
    await redis.del(`refresh_token:${userId}:${refreshToken}`);
    return { ok: true };
  }
}
