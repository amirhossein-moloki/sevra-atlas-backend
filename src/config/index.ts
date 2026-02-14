import dotenv from 'dotenv';
import path from 'path';
import { envSchema } from './env.schema';
import { parseList } from './parse';

const nodeEnv = process.env.NODE_ENV || 'development';

// Load environment variables from the appropriate file
const envFile = `.env.${nodeEnv}`;
dotenv.config({ path: path.resolve(process.cwd(), envFile) });

// Also load from .env as a fallback for shared variables
dotenv.config();

const _env = envSchema.safeParse(process.env);

if (!_env.success) {
  console.error('❌ Invalid environment variables:', JSON.stringify(_env.error.format(), null, 2));
  // In production, we want to fail fast
  if (nodeEnv === 'production') {
    process.exit(1);
  }
}

const envData = _env.success ? _env.data : ({} as any);

// Extra production checks for missing secrets
if (nodeEnv === 'production') {
  const missingSecrets: string[] = [];
  if (!envData.REDIS_PASSWORD) missingSecrets.push('REDIS_PASSWORD');
  if (!envData.ADMIN_COOKIE_PASSWORD) {
     console.warn('⚠️ ADMIN_COOKIE_PASSWORD not set, falling back to SESSION_SECRET');
  }
  if (!envData.ADMIN_SESSION_SECRET) {
     console.warn('⚠️ ADMIN_SESSION_SECRET not set, falling back to SESSION_SECRET');
  }

  if (missingSecrets.length > 0) {
    console.error(`❌ Critical secrets missing in production: ${missingSecrets.join(', ')}`);
    process.exit(1);
  }
}

/**
 * Redacts sensitive values from a configuration object for logging.
 */
function redactConfig(obj: any): any {
  const redacted = { ...obj };
  const sensitiveKeys = ['secret', 'password', 'key', 'url', 'token'];

  for (const key in redacted) {
    if (typeof redacted[key] === 'object' && redacted[key] !== null && !Array.isArray(redacted[key])) {
      redacted[key] = redactConfig(redacted[key]);
    } else if (sensitiveKeys.some(sk => key.toLowerCase().includes(sk))) {
      redacted[key] = '[REDACTED]';
    }
  }
  return redacted;
}

/**
 * Prints a summary of the configuration (non-sensitive fields only).
 */
export function printConfigSummary() {
  const summary = redactConfig(config);
  console.log('🚀 Configuration Summary:');
  console.log(JSON.stringify(summary, null, 2));
}

export const config = {
  env: envData.NODE_ENV,
  isProduction: envData.NODE_ENV === 'production',
  isDevelopment: envData.NODE_ENV === 'development',
  isTest: envData.NODE_ENV === 'test',

  server: {
    port: envData.PORT,
    baseUrl: envData.BASE_URL,
    trustProxy: envData.TRUST_PROXY,
    domain: envData.DOMAIN,
  },

  db: {
    url: envData.DATABASE_URL,
  },

  redis: {
    url: envData.REDIS_URL,
    queueUrl: envData.REDIS_QUEUE_URL || envData.REDIS_URL,
    password: envData.REDIS_PASSWORD,
  },

  auth: {
    jwt: {
      accessSecret: envData.JWT_ACCESS_SECRET,
      refreshSecret: envData.JWT_REFRESH_SECRET,
      accessTtl: envData.JWT_ACCESS_TTL,
      refreshTtl: envData.JWT_REFRESH_TTL,
    },
    otp: {
      ttl: envData.OTP_TTL_SECONDS,
      maxAttempts: envData.OTP_MAX_ATTEMPTS,
      rateLimitPerPhone: envData.OTP_RATE_LIMIT_PER_PHONE,
      rateLimitPerIp: envData.OTP_RATE_LIMIT_PER_IP,
    },
    sessionSecret: envData.SESSION_SECRET,
  },

  admin: {
    cookiePassword: envData.ADMIN_COOKIE_PASSWORD || envData.SESSION_SECRET,
    sessionSecret: envData.ADMIN_SESSION_SECRET || envData.SESSION_SECRET,
  },

  sms: {
    provider: envData.SMS_PROVIDER,
    apiKey: envData.SMS_API_KEY,
    smsir: {
      apiKey: envData.SMSIR_API_KEY,
      lineNumber: envData.SMSIR_LINE_NUMBER,
      templateId: envData.SMSIR_TEMPLATE_ID,
    },
  },

  storage: {
    provider: envData.STORAGE_PROVIDER,
    uploadDir: envData.STORAGE_UPLOAD_DIR,
    maxUploadSize: envData.MAX_UPLOAD_SIZE_BYTES,
    s3: {
      endpoint: envData.S3_ENDPOINT,
      region: envData.S3_REGION,
      accessKey: envData.S3_ACCESS_KEY,
      secretKey: envData.S3_SECRET_KEY,
      bucket: envData.S3_BUCKET,
      publicUrl: envData.S3_PUBLIC_URL,
    },
  },

  security: {
    bcryptRounds: envData.BCRYPT_ROUNDS,
    rateLimit: {
      max: envData.GLOBAL_RATE_LIMIT_MAX,
      windowS: envData.GLOBAL_RATE_LIMIT_WINDOW_S,
    },
    hsts: {
      enabled: envData.HSTS_ENABLED,
      maxAge: envData.HSTS_MAX_AGE,
    },
  },

  cors: {
    allowedOrigins: envData.ALLOWED_ORIGINS === '*' ? '*' : parseList(envData.ALLOWED_ORIGINS),
    allowedMethods: parseList(envData.CORS_ALLOWED_METHODS),
    allowCredentials: envData.CORS_ALLOW_CREDENTIALS,
  },

  worker: {
    isWorker: envData.IS_WORKER,
    enableAsync: envData.ENABLE_ASYNC_WORKERS,
    concurrency: envData.QUEUE_CONCURRENCY,
    limitMax: envData.QUEUE_LIMIT_MAX,
    limitDuration: envData.QUEUE_LIMIT_DURATION,
  },

  logging: {
    level: envData.LOG_LEVEL,
  },

  email: envData.EMAIL,
};

export type Config = typeof config;
export default config;
