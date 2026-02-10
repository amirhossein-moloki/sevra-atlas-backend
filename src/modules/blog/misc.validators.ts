import { z } from 'zod';
import { MenuLocation, PostStatus } from '@prisma/client';

export const addReactionSchema = z.object({
  body: z.object({
    reaction: z.string().min(1).max(50),
    contentTypeId: z.number(),
    objectId: z.coerce.number(),
  }),
});

export const createPageSchema = z.object({
  body: z.object({
    slug: z.string().min(1).max(50).regex(/^[a-z0-9-]+$/),
    title: z.string().min(1).max(255),
    content: z.string().min(1),
    status: z.nativeEnum(PostStatus).optional().default(PostStatus.draft),
    seoTitle: z.string().max(255).optional().default(''),
    seoDescription: z.string().optional().default(''),
  }),
});

export const updatePageSchema = z.object({
  body: createPageSchema.shape.body.partial(),
});

export const createMenuSchema = z.object({
  body: z.object({
    name: z.string().min(1).max(255),
    location: z.nativeEnum(MenuLocation),
  }),
});

export const updateMenuSchema = z.object({
  body: createMenuSchema.shape.body.partial(),
});

export const createMenuItemSchema = z.object({
  body: z.object({
    menuId: z.union([z.string(), z.number(), z.bigint()]),
    parentId: z.union([z.string(), z.number(), z.bigint()]).optional().nullable(),
    label: z.string().min(1).max(255),
    url: z.string().min(1).max(255),
    order: z.number().int().optional().default(0),
    targetBlank: z.boolean().optional().default(false),
  }),
});

export const updateMenuItemSchema = z.object({
  body: createMenuItemSchema.shape.body.partial().omit({ menuId: true }),
});
