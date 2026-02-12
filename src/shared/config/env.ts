import dotenv from 'dotenv';
import { z } from 'zod';

dotenv.config();

const envSchema = z.object({
  DATABASE_URL: z.string(),
  REDIS_URL: z.string(),
  REDIS_QUEUE_URL: z.string().optional(),
  JWT_ACCESS_SECRET: z.string(),
  JWT_REFRESH_SECRET: z.string(),
  JWT_ACCESS_TTL: z.coerce.number().default(900),
  JWT_REFRESH_TTL: z.coerce.number().default(2592000),
  OTP_TTL_SECONDS: z.coerce.number().default(120),
  OTP_MAX_ATTEMPTS: z.coerce.number().default(3),
  OTP_RATE_LIMIT_PER_PHONE: z.coerce.number().default(3),
  OTP_RATE_LIMIT_PER_IP: z.coerce.number().default(10),
  SMS_PROVIDER: z.enum(['mock', 'kavenegar', 'smsir']).default('mock'),
  SMS_API_KEY: z.string().optional(),
  SMSIR_API_KEY: z.string().optional(),
  SMSIR_LINE_NUMBER: z.coerce.number().optional(),
  SMSIR_TEMPLATE_ID: z.coerce.number().optional(),
  STORAGE_PROVIDER: z.enum(['local', 's3']).default('local'),
  S3_ENDPOINT: z.string().optional(),
  S3_REGION: z.string().optional(),
  S3_ACCESS_KEY: z.string().optional(),
  S3_SECRET_KEY: z.string().optional(),
  S3_BUCKET: z.string().optional(),
  S3_PUBLIC_URL: z.string().optional(),
  SESSION_SECRET: z.string().default('a-very-secret-key-for-adminjs-sessions'),
  PORT: z.coerce.number().default(3000),
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  IS_WORKER: z.coerce.boolean().default(false),
  ENABLE_ASYNC_WORKERS: z.coerce.boolean().default(true),
});

const _env = envSchema.safeParse(process.env);

if (!_env.success && process.env.NODE_ENV !== 'test') {
  console.error('❌ Invalid environment variables:', _env.error.format());
  process.exit(1);
}

export const env = _env.data || {} as any;
