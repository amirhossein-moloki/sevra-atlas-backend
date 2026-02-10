import { z } from 'zod';
import { UserRole, AccountStatus, Gender } from '@prisma/client';

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
