import { z } from 'zod';

export const createAuthorSchema = z.object({
  body: z.object({
    userId: z.string().openapi({ type: 'string' }),
    displayName: z.string().min(1),
    bio: z.string(),
    avatarId: z.string().optional().nullable().openapi({ type: 'string' }),
  }),
});

export const updateAuthorSchema = z.object({
  body: createAuthorSchema.shape.body.partial().omit({ userId: true }),
});
