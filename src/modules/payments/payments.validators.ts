import { z } from '../../shared/openapi/registry';

export const initZibalSchema = z.object({
  body: z.object({
    amount: z.union([z.number(), z.string()]),
    planId: z.union([z.number(), z.string()]),
    salonId: z.union([z.number(), z.string()]).optional(),
    artistId: z.union([z.number(), z.string()]).optional(),
    description: z.string().max(255).optional(),
    idempotencyKey: z.string().max(255).optional(),
    mobile: z.string().max(15).optional(),
  }),
}).openapi('InitZibalPayment');

export const zibalCallbackSchema = z.object({
  query: z.object({
    trackId: z.string(),
    success: z.string(),
    status: z.string(),
    orderId: z.string().optional(),
  }),
}).openapi('ZibalCallback');
