import { z } from 'zod';

export const createPostSchema = z.object({
  body: z.object({
    title: z.string(),
    slug: z.string(),
    excerpt: z.string(),
    content: z.string(),
    categoryId: z.string().optional(),
    status: z.enum(['draft', 'review', 'scheduled', 'published', 'archived']).optional(),
  }),
});
