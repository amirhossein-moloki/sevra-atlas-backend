import { z } from 'zod';

export const leadEventSchema = z.object({
  body: z.object({
    eventType: z.enum(['blog_to_salon', 'blog_to_call']),
    sourcePostId: z.union([z.number(), z.string()]).optional(),
    targetSalonId: z.union([z.number(), z.string()]).optional(),
  })
});
