import { prisma } from '../src/shared/db/prisma';
import { redis } from '../src/shared/redis/redis';
import { env } from '../src/shared/config/env';

async function verify() {
  console.log('🔍 Starting Production Readiness Check...');
  console.log('-----------------------------------------');

  let failed = false;

  // 1. Check Environment Variables
  console.log('1. Checking Environment Variables...');
  const requiredEnv = [
    'DATABASE_URL',
    'REDIS_URL',
    'JWT_ACCESS_SECRET',
    'JWT_REFRESH_SECRET',
  ];

  for (const key of requiredEnv) {
    if (!(process.env as any)[key]) {
      console.error(`❌ Missing required env variable: ${key}`);
      failed = true;
    } else {
      console.log(`✅ ${key} is set.`);
    }
  }

  // 2. Check Database Connectivity
  console.log('\n2. Testing Database Connectivity...');
  try {
    await prisma.$connect();
    await prisma.$queryRaw`SELECT 1`;
    console.log('✅ Database connection successful.');
  } catch (error: any) {
    console.error('❌ Database connection failed:', error.message);
    failed = true;
  }

  // 3. Check Redis Connectivity
  console.log('\n3. Testing Redis Connectivity...');
  try {
    const pong = await redis.ping();
    if (pong === 'PONG') {
      console.log('✅ Redis connection successful.');
    } else {
      console.error('❌ Redis returned unexpected response:', pong);
      failed = true;
    }
  } catch (error: any) {
    console.error('❌ Redis connection failed:', error.message);
    failed = true;
  }

  // 4. Check SMS Provider
  console.log('\n4. Checking SMS Provider...');
  console.log(`Current Provider: ${env.SMS_PROVIDER}`);
  if (env.SMS_PROVIDER === 'kavenegar') {
    if (!env.SMS_API_KEY || env.SMS_API_KEY === 'mock-key') {
      console.warn('⚠️ SMS_PROVIDER is set to kavenegar but SMS_API_KEY is missing or mock.');
    } else {
      console.log('✅ Kavenegar API Key is set.');
    }
  } else {
    console.log('ℹ️ Using Mock SMS Provider.');
  }

  console.log('\n-----------------------------------------');
  if (failed) {
    console.error('❌ Production readiness check FAILED.');
    process.exit(1);
  } else {
    console.log('✨ Production readiness check PASSED.');
    process.exit(0);
  }
}

verify().catch((err) => {
  console.error('💥 Unexpected error during verification:', err);
  process.exit(1);
});
