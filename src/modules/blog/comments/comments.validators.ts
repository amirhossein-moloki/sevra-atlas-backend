import { z } from 'zod';
import { CommentStatus } from '@prisma/client';

export const createCommentSchema = z.object({
  body: z.object({
    content: z.string().min(1).max(2000),
    parentId: z.string().optional().nullable().openapi({ type: 'string' }),
  }),
});

export const updateCommentStatusSchema = z.object({
  params: z.object({
    id: z.string().regex(/^\d+$/),
  }),
  body: z.object({
    status: z.nativeEnum(CommentStatus),
  }),
});
