import { z } from 'zod';

const slugSchema = z.string().min(1).max(50).regex(/^[a-z0-9-]+$/, 'Slug must be alphanumeric and can contain hyphens');

export const createCategorySchema = z.object({
  body: z.object({
    name: z.string().min(1).max(255),
    slug: slugSchema,
    parentId: z.union([z.string(), z.number(), z.bigint()]).optional().nullable(),
    description: z.string().optional().default(''),
    order: z.number().int().optional().default(0),
  }),
});

export const updateCategorySchema = z.object({
  body: createCategorySchema.shape.body.partial(),
});

export const createTagSchema = z.object({
  body: z.object({
    name: z.string().min(1).max(255),
    slug: slugSchema,
    description: z.string().optional().default(''),
  }),
});

export const updateTagSchema = z.object({
  body: createTagSchema.shape.body.partial(),
});

export const createSeriesSchema = z.object({
  body: z.object({
    title: z.string().min(1).max(255),
    slug: slugSchema,
    description: z.string().optional().default(''),
    orderStrategy: z.enum(['manual', 'by_date']).optional().default('manual'),
  }),
});

export const updateSeriesSchema = z.object({
  body: createSeriesSchema.shape.body.partial(),
});
