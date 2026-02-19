import crypto from 'crypto';
import { UserRole } from '@prisma/client';
import { generateAccessToken } from '../src/shared/auth/jwt';

export const generateUniquePhone = () => {
  // Use a fixed prefix and random suffix to avoid collisions while keeping it valid-ish
  const random = Math.floor(Math.random() * 900000000) + 100000000;
  return `+989${random}`;
};

export const generateUniqueUsername = (prefix = 'user') => {
  return `${prefix}_${crypto.randomBytes(4).toString('hex')}`;
};

export const generateUniqueSlug = (prefix = 'slug') => {
  return `${prefix}-${crypto.randomBytes(4).toString('hex')}`;
};

export const generateUniqueToken = () => {
  return crypto.randomBytes(32).toString('hex');
};

export const createTokenForRole = (role: UserRole, userId: string = '1') => {
  return generateAccessToken({ sub: userId, role });
};

export const getAuthHeader = (token: string) => {
  return { 'Authorization': `Bearer ${token}` };
};

export const checkProdWriteGuard = () => {
  if (process.env.NODE_ENV === 'production') {
    if (process.env.SANDBOX_MODE === 'true' || process.env.ALLOW_PROD_WRITES === 'true') {
      return false;
    }
    return true;
  }
  return false;
};
