import { z } from 'zod';

export const createMediaSchema = z.object({
  body: z.object({
    url: z.string().url(),
    storageKey: z.string(),
    type: z.string(),
    mime: z.string(),
    sizeBytes: z.number().int(),
    width: z.number().int().optional(),
    height: z.number().int().optional(),
    duration: z.number().int().optional(),
    altText: z.string().optional(),
    title: z.string().optional(),
    kind: z.enum(['AVATAR', 'COVER', 'GALLERY', 'LICENSE', 'CERTIFICATE', 'OG_IMAGE']).optional(),
    entityType: z.enum(['SALON', 'ARTIST', 'REVIEW', 'BLOG_POST', 'BLOG_PAGE', 'CITY', 'PROVINCE', 'CATEGORY']).optional(),
    entityId: z.string().optional(),
  }),
});
