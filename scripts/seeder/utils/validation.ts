import { z } from 'zod';
import { UserRole, AccountStatus, PostStatus, VerificationStatus } from '@prisma/client';

export const UserSchema = z.object({
  username: z.string().min(3).max(150),
  email: z.string().email(),
  firstName: z.string().min(2),
  lastName: z.string().min(2),
  phoneNumber: z.string().regex(/^\+989\d{9}$/),
  role: z.nativeEnum(UserRole),
  status: z.nativeEnum(AccountStatus),
  isActive: z.boolean(),
  isStaff: z.boolean(),
  referralCode: z.string().min(5).max(22),
});

export const SalonSchema = z.object({
  name: z.string().min(3).max(255),
  slug: z.string().min(3),
  phone: z.string().optional(),
  summary: z.string().max(100).optional(),
  description: z.string().optional(),
  status: z.nativeEnum(AccountStatus),
  verification: z.nativeEnum(VerificationStatus),
});

export const PostSchema = z.object({
  title: z.string().min(5).max(255),
  slug: z.string().min(5),
  excerpt: z.string().min(10),
  content: z.string().min(50),
  status: z.nativeEnum(PostStatus),
});

export const validate = <T>(schema: z.ZodSchema<T>, data: unknown): T => {
  return schema.parse(data);
};
