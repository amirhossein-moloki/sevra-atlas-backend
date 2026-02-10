import { z } from '../../../shared/openapi/registry';
import { PostStatus, PostVisibility } from '@prisma/client';

export const createPostSchema = z.object({
  body: z.object({
    title: z.string().openapi({ example: 'My Awesome Post' }),
    excerpt: z.string().openapi({ example: 'Summary of the post' }),
    content: z.string().openapi({ example: '<p>Content here...</p>' }),
    status: z.nativeEnum(PostStatus).optional(),
    visibility: z.nativeEnum(PostVisibility).optional(),
    is_hot: z.boolean().optional(),
    slug: z.string().optional().openapi({ example: 'my-awesome-post' }),
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
}).openapi('CreatePost');

export const updatePostSchema = z.object({
  body: createPostSchema.shape.body.partial(),
}).openapi('UpdatePost');
