import { z } from 'zod';

export const createSalonSchema = z.object({
  body: z.object({
    name: z.string(),
    slug: z.string(),
    summary: z.string().optional(),
    description: z.string().optional(),
    phone: z.string().optional(),
    cityId: z.string().optional(),
    neighborhoodId: z.string().optional(),
    addressLine: z.string().optional(),
  }),
});

export const updateSalonSchema = z.object({
  body: z.object({
    name: z.string().optional(),
    slug: z.string().optional(),
    summary: z.string().optional(),
    description: z.string().optional(),
    phone: z.string().optional(),
  }),
});
