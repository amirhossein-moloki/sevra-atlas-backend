import { z } from 'zod';

export const mediaSchema = z.object({
  id: z.string(),
  url: z.string(),
  storageKey: z.string(),
  type: z.string(),
  mime: z.string(),
  sizeBytes: z.number(),
  width: z.number().nullable(),
  height: z.number().nullable(),
  duration: z.number().nullable(),
  altText: z.string().nullable(),
  title: z.string().nullable(),
  kind: z.string().nullable(),
  variants: z.any().nullable(),
  createdAt: z.date(),
}).openapi('Media');

export const createMediaSchema = z.object({
  body: z.object({
    url: z.string().url(),
    storageKey: z.string().max(255),
    type: z.string().max(50),
    mime: z.string().max(100),
    sizeBytes: z.number().int().min(0),
    width: z.number().int().min(1).optional(),
    height: z.number().int().min(1).optional(),
    duration: z.number().int().min(1).optional(),
    altText: z.string().max(255).optional().default(''),
    title: z.string().max(255).optional().default(''),
    kind: z.enum(['AVATAR', 'COVER', 'GALLERY', 'LICENSE', 'CERTIFICATE', 'OG_IMAGE']).optional(),
    entityType: z.enum(['SALON', 'ARTIST', 'REVIEW', 'BLOG_POST', 'BLOG_PAGE', 'CITY', 'PROVINCE', 'CATEGORY']).optional(),
    entityId: z.union([z.string(), z.number()]).optional().nullable(),
  }),
});

export const updateMediaSchema = z.object({
  body: z.object({
    altText: z.string().max(255).optional(),
    title: z.string().max(255).optional(),
    kind: z.enum(['AVATAR', 'COVER', 'GALLERY', 'LICENSE', 'CERTIFICATE', 'OG_IMAGE']).optional(),
  }).strict(),
});
