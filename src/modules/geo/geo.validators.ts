import { z } from 'zod';

const provinceSchema = z.object({
  nameFa: z.string(),
  nameEn: z.string().optional(),
  slug: z.string(),
});

const citySchema = z.object({
  provinceId: z.string(),
  nameFa: z.string(),
  nameEn: z.string().optional(),
  slug: z.string(),
});

const neighborhoodSchema = z.object({
  cityId: z.string(),
  nameFa: z.string(),
  slug: z.string(),
});

export const createProvinceSchema = z.object({ body: provinceSchema });
export const createCitySchema = z.object({ body: citySchema });
export const createNeighborhoodSchema = z.object({ body: neighborhoodSchema });

export const updateCitySchema = z.object({
  body: citySchema.partial(),
});

export const updateNeighborhoodSchema = z.object({
  body: neighborhoodSchema.partial(),
});
