import { z } from 'zod';

export const provinceSchema = z.object({
  id: z.string(),
  nameFa: z.string(),
  nameEn: z.string().optional().nullable(),
  slug: z.string(),
}).openapi('Province');

export const citySchema = z.object({
  id: z.string(),
  provinceId: z.string(),
  nameFa: z.string(),
  nameEn: z.string().optional().nullable(),
  slug: z.string(),
}).openapi('City');

export const neighborhoodSchema = z.object({
  id: z.string(),
  cityId: z.string(),
  nameFa: z.string(),
  slug: z.string(),
}).openapi('Neighborhood');

export const createProvinceSchema = z.object({
  body: z.object({
    nameFa: z.string(),
    nameEn: z.string().optional(),
    slug: z.string(),
  })
});
export const createCitySchema = z.object({
  body: z.object({
    provinceId: z.string(),
    nameFa: z.string(),
    nameEn: z.string().optional(),
    slug: z.string(),
  })
});
export const createNeighborhoodSchema = z.object({
  body: z.object({
    cityId: z.string(),
    nameFa: z.string(),
    slug: z.string(),
  })
});

export const updateCitySchema = z.object({
  body: citySchema.partial(),
});

export const updateNeighborhoodSchema = z.object({
  body: neighborhoodSchema.partial(),
});
