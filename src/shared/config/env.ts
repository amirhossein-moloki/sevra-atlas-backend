import dotenv from 'dotenv';
import { z } from 'zod';

dotenv.config();

const envSchema = z.object({
  DATABASE_URL: z.string(),
  REDIS_URL: z.string(),
  JWT_ACCESS_SECRET: z.string(),
  JWT_REFRESH_SECRET: z.string(),
  JWT_ACCESS_TTL: z.coerce.number().default(900),
  JWT_REFRESH_TTL: z.coerce.number().default(2592000),
  OTP_TTL_SECONDS: z.coerce.number().default(120),
  OTP_MAX_ATTEMPTS: z.coerce.number().default(3),
  OTP_RATE_LIMIT_PER_PHONE: z.coerce.number().default(3),
  OTP_RATE_LIMIT_PER_IP: z.coerce.number().default(10),
  SMS_PROVIDER: z.enum(['mock', 'kavenegar']).default('mock'),
  SMS_API_KEY: z.string().optional(),
  PORT: z.coerce.number().default(3000),
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
});

const _env = envSchema.safeParse(process.env);

if (!_env.success) {
  console.error('❌ Invalid environment variables:', _env.error.format());
  process.exit(1);
}

export const env = _env.data;
