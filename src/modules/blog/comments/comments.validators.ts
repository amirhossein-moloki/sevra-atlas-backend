import { z } from 'zod';
import { CommentStatus } from '@prisma/client';

export const createCommentSchema = z.object({
  body: z.object({
    content: z.string().min(1).max(2000),
    parentId: z.union([z.string(), z.number(), z.bigint()]).optional().nullable(),
  }),
});

export const updateCommentStatusSchema = z.object({
  body: z.object({
    status: z.nativeEnum(CommentStatus),
  }),
});
