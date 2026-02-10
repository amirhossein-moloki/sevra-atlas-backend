import { z } from 'zod';

export const createAuthorSchema = z.object({
  body: z.object({
    userId: z.union([z.string(), z.number(), z.bigint()]),
    displayName: z.string().min(1),
    bio: z.string(),
    avatarId: z.union([z.string(), z.number(), z.bigint()]).optional().nullable(),
  }),
});

export const updateAuthorSchema = z.object({
  body: createAuthorSchema.shape.body.partial().omit({ userId: true }),
});
