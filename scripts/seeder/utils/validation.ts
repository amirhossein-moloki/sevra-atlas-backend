import { z } from 'zod';

export const UserSeedSchema = z.object({
  username: z.string(),
  email: z.string().email(),
  firstName: z.string(),
  lastName: z.string(),
  phoneNumber: z.string(),
  role: z.enum(['USER', 'SALON', 'ARTIST', 'AUTHOR', 'MODERATOR', 'ADMIN']),
  isActive: z.boolean(),
  isStaff: z.boolean(),
  referralCode: z.string()
});

export const SalonSeedSchema = z.object({
  name: z.string(),
  slug: z.string(),
  cityId: z.bigint(),
  priceTier: z.number().min(1).max(4),
  isWomenOnly: z.boolean(),
  primaryOwnerId: z.bigint()
});
