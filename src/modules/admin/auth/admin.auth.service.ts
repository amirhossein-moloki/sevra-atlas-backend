import { prisma } from '../../../shared/db/prisma';
import { redis } from '../../../shared/redis/redis';
import { RedisFallback } from '../../../shared/redis/redis-fallback';
import { config } from '../../../config';
import { ApiError } from '../../../shared/errors/ApiError';
import { generateAccessToken, generateRefreshToken } from '../../../shared/auth/jwt';
import { UserRole } from '@prisma/client';
import bcrypt from 'bcrypt';
import crypto from 'crypto';
import { logger } from '../../../shared/logger/logger';

export class AdminAuthService {
  async login(identifier: string, password: Buffer | string) {
    const user = await prisma.user.findFirst({
      where: {
        OR: [
          { email: identifier },
          { username: identifier },
          { phoneNumber: identifier },
        ],
      },
    });

    if (!user || !user.isActive) {
      logger.warn(`Failed admin login attempt: User not found or inactive (${identifier})`);
      throw new ApiError(401, 'Invalid credentials');
    }

    if (!([UserRole.ADMIN, UserRole.SUPER_ADMIN] as UserRole[]).includes(user.role)) {
      logger.warn(`Failed admin login attempt: Non-admin role (${user.role}) for user ${user.id}`);
      throw new ApiError(403, 'Access denied. Admin role required.');
    }

    if (!user.password) {
      logger.warn(`Failed admin login attempt: No password set for admin user ${user.id}`);
      throw new ApiError(401, 'Password not set for this account');
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      logger.warn(`Failed admin login attempt: Invalid password for user ${user.id}`);
      throw new ApiError(401, 'Invalid credentials');
    }

    const version = await this.getTokenVersion(user.id.toString());
    const payload = { sub: user.id.toString(), role: user.role, v: version };
    const accessToken = generateAccessToken(payload);
    const refreshToken = generateRefreshToken(payload);

    const expiresAt = new Date(Date.now() + config.auth.jwt.refreshTtl * 1000);
    const tokenHash = crypto.createHash('sha256').update(refreshToken).digest('hex');

    await RedisFallback.tryReady(
      'storeRefreshToken',
      () => redis.set(`refresh_token:${user!.id}:${tokenHash}`, '1', 'EX', config.auth.jwt.refreshTtl),
      null
    );

    await prisma.refreshToken.create({
      data: {
        userId: user.id,
        token: tokenHash,
        expiresAt,
      },
    });

    return {
      accessToken,
      refreshToken,
      user: {
        id: user.id.toString(),
        username: user.username,
        email: user.email,
        role: user.role,
      },
    };
  }

  private async getTokenVersion(userId: string): Promise<number> {
    const version = await RedisFallback.tryReady(
      'getTokenVersion',
      () => redis.get(`user_token_version:${userId}`),
      null
    );
    return version ? parseInt(version) : 0;
  }
}
