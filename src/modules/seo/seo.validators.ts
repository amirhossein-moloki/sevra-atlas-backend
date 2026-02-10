import { z } from 'zod';

export const setSeoMetaSchema = z.object({
  body: z.object({
    entityType: z.enum(['SALON', 'ARTIST', 'REVIEW', 'BLOG_POST', 'BLOG_PAGE', 'CITY', 'PROVINCE', 'CATEGORY']),
    entityId: z.string(),
    title: z.string().optional(),
    description: z.string().optional(),
    canonicalMode: z.enum(['SELF', 'CUSTOM']).optional(),
    canonicalUrl: z.string().optional(),
    robots: z.enum(['INDEX_FOLLOW', 'NOINDEX_FOLLOW', 'NOINDEX_NOFOLLOW']).optional(),
    ogTitle: z.string().optional(),
    ogDescription: z.string().optional(),
    ogImageMediaId: z.string().optional(),
    twitterTitle: z.string().optional(),
    twitterDesc: z.string().optional(),
    twitterImageMediaId: z.string().optional(),
    h1: z.string().optional(),
    breadcrumbLabel: z.string().optional(),
  }),
});

export const createRedirectSchema = z.object({
  body: z.object({
    fromPath: z.string(),
    toPath: z.string(),
    type: z.enum(['PERMANENT_301', 'TEMPORARY_302']).optional(),
  }),
});
