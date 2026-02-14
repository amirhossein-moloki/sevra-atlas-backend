import dotenv from 'dotenv';
import path from 'path';
import { z } from 'zod';

const nodeEnv = process.env.NODE_ENV || 'development';

// Load environment variables from the appropriate file
const envFile = `.env.${nodeEnv}`;
dotenv.config({ path: path.resolve(process.cwd(), envFile) });

// Also load from .env as a fallback for shared variables
dotenv.config();

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.coerce.number().default(3000),
  DATABASE_URL: z.string(),
  REDIS_URL: z.string(),
  REDIS_QUEUE_URL: z.string().optional(),
  REDIS_PASSWORD: z.string().optional(),
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
  SESSION_SECRET: z.string(),
  IS_WORKER: z.coerce.boolean().default(false),
  ENABLE_ASYNC_WORKERS: z.coerce.boolean().default(true),
  DOMAIN: z.string().optional(),
  EMAIL: z.string().optional(),
  ALLOWED_ORIGINS: z.string().default('*'),
});

export type Config = z.infer<typeof envSchema>;

const _env = envSchema.safeParse(process.env);

if (!_env.success) {
  console.error('❌ Invalid environment variables:', JSON.stringify(_env.error.format(), null, 2));
  // In production, we want to fail fast
  if (nodeEnv === 'production') {
    process.exit(1);
  }
}

// Extra production checks
if (nodeEnv === 'production' && _env.success) {
  if (!_env.data.REDIS_PASSWORD) {
    console.error('❌ REDIS_PASSWORD is required in production');
    process.exit(1);
  }
}

export const config: Config = _env.success ? _env.data : ({} as Config);

export default config;
