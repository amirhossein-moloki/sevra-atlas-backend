import { z } from 'zod';

export const adminLoginSchema = z.object({
  body: z.object({
    identifier: z.string().min(1, 'Identifier is required'),
    password: z.string().min(1, 'Password is required'),
  }),
});

export type AdminLoginInput = z.infer<typeof adminLoginSchema>['body'];
