import { z } from 'zod';
import { VerificationStatus } from '@prisma/client';

export const requestVerificationSchema = z.object({
  body: z.object({
    targetType: z.enum(['SALON', 'ARTIST']),
    targetId: z.coerce.number(),
    notes: z.string().optional(),
    documents: z.array(z.object({
      label: z.string(),
      mediaId: z.string(),
    })),
  }),
});

export const reviewVerificationSchema = z.object({
  body: z.object({
    status: z.nativeEnum(VerificationStatus),
    notes: z.string().optional(),
  }),
});
