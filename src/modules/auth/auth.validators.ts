import { z } from 'zod';

export const requestOtpSchema = z.object({
  body: z.object({
    phoneNumber: z.string().regex(/^(\+98|0)?9\d{9}$/, 'Invalid Iranian phone number'),
  }),
});

export const verifyOtpSchema = z.object({
  body: z.object({
    phoneNumber: z.string().regex(/^(\+98|0)?9\d{9}$/, 'Invalid Iranian phone number'),
    code: z.string().length(6),
  }),
});
