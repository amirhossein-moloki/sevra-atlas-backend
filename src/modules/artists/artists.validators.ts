import { z } from 'zod';

export const createArtistSchema = z.object({
  body: z.object({
    fullName: z.string(),
    slug: z.string(),
    summary: z.string().optional(),
    bio: z.string().optional(),
    phone: z.string().optional(),
    instagram: z.string().optional(),
    website: z.string().optional(),
    cityId: z.coerce.string().optional(),
    neighborhoodId: z.coerce.string().optional(),
  }),
});

export const updateArtistSchema = z.object({
  body: createArtistSchema.shape.body.partial().extend({
    avatarMediaId: z.coerce.string().optional(),
    coverMediaId: z.coerce.string().optional(),
  }),
});

export const certificationSchema = z.object({
  body: z.object({
    title: z.string(),
    issuer: z.string(),
    issuerSlug: z.string().optional(),
    category: z.string().optional(),
    level: z.string().optional(),
    issuedAt: z.string().optional(),
    expiresAt: z.string().optional(),
    credentialId: z.string().optional(),
    credentialUrl: z.string().optional(),
    mediaId: z.coerce.string().optional(),
  }),
});

export const assignSpecialtiesSchema = z.object({
  body: z.object({
    specialties: z.array(z.object({
      specialtyId: z.coerce.string(),
      priceToman: z.coerce.string().optional(),
      durationMin: z.number().optional(),
      isActive: z.boolean().default(true),
      note: z.string().optional(),
      order: z.number().optional(),
    })),
    mode: z.enum(['replace', 'append']).default('replace'),
  }),
});
