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
    cityId: z.coerce.number().optional(),
    neighborhoodId: z.coerce.number().optional(),
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
      serviceId: z.number(),
      notes: z.string().optional(),
    })),
  }),
}).openapi('AssignServices');

export const linkArtistSchema = z.object({
  body: z.object({
    artistId: z.coerce.number(),
    roleTitle: z.string().optional(),
    isActive: z.boolean().optional(),
    startedAt: z.string().optional(),
  }),
}).openapi('LinkArtist');

export const setMediaSchema = z.object({
  body: z.object({
    mediaId: z.string().optional(),
    mediaIds: z.array(z.string()).optional(),
    media: z.object({
      storageKey: z.string(),
      url: z.string(),
      type: z.string(),
      mime: z.string(),
      width: z.number().optional(),
      height: z.number().optional(),
      sizeBytes: z.number().optional(),
    }).optional(),
  }).refine(data => data.mediaId || data.mediaIds || data.media, {
    message: "Either mediaId, mediaIds or media object must be provided",
  }),
});
