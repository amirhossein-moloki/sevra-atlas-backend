import { z } from 'zod';

export const createReviewSchema = z.object({
  body: z.object({
    targetType: z.enum(['SALON', 'ARTIST']),
    targetId: z.string(),
    rating: z.number().min(1).max(5),
    title: z.string().optional(),
    body: z.string().optional(),
  }).refine(data => !!data.targetId, { message: 'targetId is required' }),
});

export const voteReviewSchema = z.object({
  body: z.object({
    isLike: z.boolean(),
  }),
});
