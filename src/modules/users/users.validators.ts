import { z } from 'zod';
import { UserRole, AccountStatus, Gender } from '@prisma/client';

export const userSchema = z.object({
  id: z.string(),
  username: z.string().nullable(),
  phoneNumber: z.string(),
  firstName: z.string().nullable(),
  lastName: z.string().nullable(),
  role: z.nativeEnum(UserRole),
  status: z.nativeEnum(AccountStatus),
  gender: z.nativeEnum(Gender).nullable(),
  bio: z.string().nullable(),
  cityId: z.string().nullable(),
  createdAt: z.date(),
  updatedAt: z.date(),
}).openapi('User');

export const updateMeSchema = z.object({
  body: z.object({
    firstName: z.string().optional(),
    lastName: z.string().optional(),
    bio: z.string().optional(),
    cityId: z.coerce.number().optional(),
    gender: z.nativeEnum(Gender).optional(),
  }),
});

export const updateRoleSchema = z.object({
  body: z.object({
    role: z.nativeEnum(UserRole),
  }),
});

export const updateStatusSchema = z.object({
  body: z.object({
    status: z.nativeEnum(AccountStatus),
  }),
});
