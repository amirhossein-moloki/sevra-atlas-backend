import { z } from '../../shared/openapi/registry';

export const requestOtpSchema = z.object({
  body: z.object({
    phoneNumber: z.string()
      .regex(/^(\+98|0)?9\d{9}$/, 'Invalid Iranian phone number')
      .openapi({ example: '09123456789', description: 'Iranian phone number' }),
  }),
}).openapi('RequestOtp');

export const verifyOtpSchema = z.object({
  body: z.object({
    phoneNumber: z.string()
      .regex(/^(\+98|0)?9\d{9}$/, 'Invalid Iranian phone number')
      .openapi({ example: '09123456789' }),
    code: z.string()
      .length(6)
      .openapi({ example: '123456' }),
  }),
}).openapi('VerifyOtp');

export const refreshTokenSchema = z.object({
  body: z.object({
    refreshToken: z.string().openapi({ example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...' }),
  }),
}).openapi('RefreshToken');

export const authResponseSchema = z.object({
  accessToken: z.string(),
  refreshToken: z.string(),
  user: z.object({
    id: z.string(),
    phoneNumber: z.string(),
    role: z.string(),
  }),
}).openapi('AuthResponse');
