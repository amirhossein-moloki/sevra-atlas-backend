import { z } from 'zod';
import { VerificationStatus } from '@prisma/client';

export const requestVerificationSchema = z.object({
  body: z.object({
    targetType: z.enum(['SALON', 'ARTIST']),
    targetId: z.coerce.number(),
    notes: z.string().optional(),
    documents: z.array(z.object({
      label: z.string(),
      media: z.object({
        storageKey: z.string(),
        url: z.string(),
        type: z.string(),
        mime: z.string(),
      }),
    })),
  }),
});

export const reviewVerificationSchema = z.object({
  body: z.object({
    status: z.nativeEnum(VerificationStatus),
    notes: z.string().optional(),
  }),
});
