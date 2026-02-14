import { z } from 'zod';

const booleanSchema = z.preprocess((val) => {
  if (typeof val === 'string') {
    if (val.toLowerCase() === 'true' || val === '1') return true;
    if (val.toLowerCase() === 'false' || val === '0') return false;
  }
  return val;
}, z.boolean());

export const envSchema = z.object({
  // Node Environment
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),

  // Server
  PORT: z.coerce.number().default(3000),
  BASE_URL: z.string().optional(),
  TRUST_PROXY: z.string().default('1'),
  DOMAIN: z.string().optional(),

  // Database
  DATABASE_URL: z.string(),

  // Redis
  REDIS_URL: z.string(),
  REDIS_QUEUE_URL: z.string().optional(),
  REDIS_PASSWORD: z.string().optional(),

  // Auth
  JWT_ACCESS_SECRET: z.string(),
  JWT_REFRESH_SECRET: z.string(),
  JWT_ACCESS_TTL: z.coerce.number().default(900),
  JWT_REFRESH_TTL: z.coerce.number().default(2592000),
  OTP_TTL_SECONDS: z.coerce.number().default(120),
  OTP_MAX_ATTEMPTS: z.coerce.number().default(3),
  OTP_RATE_LIMIT_PER_PHONE: z.coerce.number().default(3),
  OTP_RATE_LIMIT_PER_IP: z.coerce.number().default(10),

  // Session & Admin
  SESSION_SECRET: z.string(),
  ADMIN_COOKIE_PASSWORD: z.string().optional(), // If missing, use SESSION_SECRET with warning in production
  ADMIN_SESSION_SECRET: z.string().optional(), // If missing, use SESSION_SECRET with warning in production

  // SMS
  SMS_PROVIDER: z.enum(['mock', 'kavenegar', 'smsir']).default('mock'),
  SMS_API_KEY: z.string().optional(),
  SMSIR_API_KEY: z.string().optional(),
  SMSIR_LINE_NUMBER: z.coerce.number().optional(),
  SMSIR_TEMPLATE_ID: z.coerce.number().optional(),

  // Storage
  STORAGE_PROVIDER: z.enum(['local', 's3']).default('local'),
  STORAGE_UPLOAD_DIR: z.string().default('uploads'),
  MAX_UPLOAD_SIZE_BYTES: z.coerce.number().default(10485760), // 10MB default
  S3_ENDPOINT: z.string().optional(),
  S3_REGION: z.string().optional(),
  S3_ACCESS_KEY: z.string().optional(),
  S3_SECRET_KEY: z.string().optional(),
  S3_BUCKET: z.string().optional(),
  S3_PUBLIC_URL: z.string().optional(),

  // Security
  BCRYPT_ROUNDS: z.coerce.number().default(12),
  GLOBAL_RATE_LIMIT_MAX: z.coerce.number().default(100),
  GLOBAL_RATE_LIMIT_WINDOW_S: z.coerce.number().default(60),
  HSTS_ENABLED: booleanSchema.default(true),
  HSTS_MAX_AGE: z.coerce.number().default(31536000),

  // CORS
  ALLOWED_ORIGINS: z.string().default('*'),
  CORS_ALLOWED_METHODS: z.string().default('GET,POST,PUT,PATCH,DELETE,OPTIONS'),
  CORS_ALLOW_CREDENTIALS: booleanSchema.default(true),

  // Worker
  IS_WORKER: booleanSchema.default(false),
  ENABLE_ASYNC_WORKERS: booleanSchema.default(true),
  QUEUE_CONCURRENCY: z.coerce.number().optional(), // Default in code if not set
  QUEUE_LIMIT_MAX: z.coerce.number().default(10),
  QUEUE_LIMIT_DURATION: z.coerce.number().default(1000),

  // Logging
  LOG_LEVEL: z.enum(['fatal', 'error', 'warn', 'info', 'debug', 'trace']).default('info'),

  // Misc
  EMAIL: z.string().optional(),
});

export type EnvConfig = z.infer<typeof envSchema>;
