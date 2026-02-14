import crypto from 'crypto';

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
