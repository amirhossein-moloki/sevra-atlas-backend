import { z } from 'zod';
import { PostStatus, PostVisibility } from '@prisma/client';

export const createPostSchema = z.object({
  body: z.object({
    title: z.string(),
    excerpt: z.string(),
    content: z.string(),
    status: z.nativeEnum(PostStatus).optional(),
    visibility: z.nativeEnum(PostVisibility).optional(),
    is_hot: z.boolean().optional(),
    slug: z.string().optional(),
    canonical_url: z.string().url().optional().nullable(),
    seo_title: z.string().optional(),
    seo_description: z.string().optional(),
    category_id: z.coerce.number().optional(),
    tag_ids: z.array(z.number()).optional(),
    cover_media_id: z.coerce.number().optional().nullable(),
    og_image_id: z.coerce.number().optional().nullable(),
    series_id: z.coerce.number().optional().nullable(),
    publish_at: z.string().datetime().optional().nullable(),
  }),
});

export const updatePostSchema = z.object({
  body: createPostSchema.shape.body.partial(),
});
