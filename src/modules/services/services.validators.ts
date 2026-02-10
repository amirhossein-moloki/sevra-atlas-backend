import { z } from 'zod';

export const createCategorySchema = z.object({
  body: z.object({
    nameFa: z.string(),
    slug: z.string(),
    order: z.number().optional(),
  }),
});

export const createServiceSchema = z.object({
  body: z.object({
    categoryId: z.coerce.number(),
    nameFa: z.string(),
    slug: z.string(),
    description: z.string().optional(),
  }),
});

export const updateServiceSchema = z.object({
  body: z.object({
    categoryId: z.coerce.number().optional(),
    nameFa: z.string().optional(),
    slug: z.string().optional(),
    description: z.string().optional(),
  }),
});
