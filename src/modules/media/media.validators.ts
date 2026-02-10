import { z } from 'zod';

export const createMediaSchema = z.object({
  body: z.object({
    url: z.string().url(),
    storageKey: z.string().max(255),
    type: z.string().max(50),
    mime: z.string().max(100),
    sizeBytes: z.number().int().nonnegative(),
    width: z.number().int().positive().optional(),
    height: z.number().int().positive().optional(),
    duration: z.number().int().positive().optional(),
    altText: z.string().max(255).optional().default(''),
    title: z.string().max(255).optional().default(''),
    kind: z.enum(['AVATAR', 'COVER', 'GALLERY', 'LICENSE', 'CERTIFICATE', 'OG_IMAGE']).optional(),
    entityType: z.enum(['SALON', 'ARTIST', 'REVIEW', 'BLOG_POST', 'BLOG_PAGE', 'CITY', 'PROVINCE', 'CATEGORY']).optional(),
    entityId: z.union([z.string(), z.number(), z.bigint()]).optional().nullable(),
  }),
});

export const updateMediaSchema = z.object({
  body: z.object({
    altText: z.string().max(255).optional(),
    title: z.string().max(255).optional(),
    kind: z.enum(['AVATAR', 'COVER', 'GALLERY', 'LICENSE', 'CERTIFICATE', 'OG_IMAGE']).optional(),
  }).strict(),
});
