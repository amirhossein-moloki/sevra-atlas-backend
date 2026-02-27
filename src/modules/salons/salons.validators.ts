import { z } from '../../shared/openapi/registry';

export const createSalonSchema = z.object({
  body: z.object({
    name: z.string().openapi({ example: 'Beauty Palace' }),
    slug: z.string().openapi({ example: 'beauty-palace' }),
    summary: z.string().optional(),
    description: z.string().optional(),
    phone: z.string().optional(),
    cityId: z.string().optional(),
    neighborhoodId: z.string().optional(),
    addressLine: z.string().optional(),
  }),
}).openapi('CreateSalon');

export const updateSalonSchema = z.object({
  body: z.object({
    name: z.string().optional(),
    slug: z.string().optional(),
    summary: z.string().optional(),
    description: z.string().optional(),
    phone: z.string().optional(),
    instagram: z.string().optional(),
    website: z.string().optional(),
    cityId: z.coerce.string().optional(),
    neighborhoodId: z.coerce.string().optional(),
    addressLine: z.string().optional(),
    postalCode: z.string().optional(),
    lat: z.number().optional(),
    lng: z.number().optional(),
    isWomenOnly: z.boolean().optional(),
    priceTier: z.number().optional(),
    avatarMediaId: z.coerce.string().optional(),
    coverMediaId: z.coerce.string().optional(),
  }),
}).openapi('UpdateSalon');

export const assignServicesSchema = z.object({
  body: z.object({
    services: z.array(z.object({
      serviceId: z.coerce.string(),
      minPriceToman: z.coerce.string().optional(),
      maxPriceToman: z.coerce.string().optional(),
      minDurationMin: z.number().optional(),
      maxDurationMin: z.number().optional(),
      priceToman: z.coerce.string().optional(), // deprecated
      durationMin: z.number().optional(), // deprecated
      isActive: z.boolean().default(true),
      notes: z.string().optional(),
      order: z.number().optional(),
    }).refine(data => {
      const minVal = data.minPriceToman ?? data.priceToman;
      const maxVal = data.maxPriceToman ?? data.priceToman;

      if (minVal === undefined || maxVal === undefined) return false;

      const isNumeric = (val: string) => /^\d+$/.test(val);
      if (!isNumeric(minVal) || !isNumeric(maxVal)) return false;

      const min = BigInt(minVal);
      const max = BigInt(maxVal);
      return min <= max && min >= 0;
    }, {
      message: "Prices must be valid non-negative numbers and min must be <= max",
      path: ["minPriceToman"]
    }).refine(data => {
      const minDur = data.minDurationMin ?? data.durationMin;
      const maxDur = data.maxDurationMin ?? data.durationMin;

      if (minDur !== undefined && maxDur !== undefined) {
        return minDur <= maxDur && minDur >= 0;
      }
      return true;
    }, {
      message: "minDurationMin must be less than or equal to maxDurationMin and non-negative",
      path: ["minDurationMin"]
    })),
    mode: z.enum(['replace', 'append']).default('replace'),
  }),
}).openapi('AssignServices');

export const linkArtistSchema = z.object({
  body: z.object({
    artistId: z.coerce.string(),
    roleTitle: z.string().optional(),
    isActive: z.boolean().optional(),
    startedAt: z.string().optional(),
  }),
}).openapi('LinkArtist');

export const setMediaSchema = z.object({
  body: z.object({
    mediaId: z.string().optional(),
    mediaIds: z.array(z.string()).optional(),
  }).refine(data => data.mediaId || data.mediaIds, {
    message: "Either mediaId or mediaIds must be provided",
  }),
});
