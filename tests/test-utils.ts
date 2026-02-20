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

export const createTokenForRole = (role: UserRole, userId?: string) => {
  const defaultIds: Record<string, string> = {
    [UserRole.ADMIN]: '1',
    [UserRole.USER]: '2',
    [UserRole.ARTIST]: '3',
    [UserRole.SALON]: '4',
    [UserRole.AUTHOR]: '5',
    [UserRole.MODERATOR]: '6',
  };
  return generateAccessToken({ sub: userId || defaultIds[role] || '1', role });
};

export const getAuthHeader = (token: string) => {
  return { 'Authorization': `Bearer ${token}` };
};

export const getJsonAuthHeader = (token: string) => {
  return {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json',
    'Accept': 'application/json'
  };
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
