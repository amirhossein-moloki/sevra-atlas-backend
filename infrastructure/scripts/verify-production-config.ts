import { prisma } from '../../src/shared/db/prisma';
import { redis } from '../../src/shared/redis/redis';
import { config } from '../../src/config';

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
  console.log(`Current Provider: ${config.sms.provider}`);
  if (config.sms.provider === 'kavenegar') {
    if (!config.sms.apiKey || config.sms.apiKey === 'mock-key') {
      console.warn('⚠️ SMS_PROVIDER is set to kavenegar but SMS_API_KEY is missing or mock.');
    } else {
      console.log('✅ Kavenegar API Key is set.');
    }
  } else {
    console.log('ℹ️ Using Mock SMS Provider.');
  }

  // 5. Check Storage Provider
  console.log('\n5. Checking Storage Provider...');
  console.log(`Current Provider: ${config.storage.provider}`);
  if (config.storage.provider === 's3') {
    const s3 = config.storage.s3;
    const missingS3 = [];
    if (!s3.accessKey) missingS3.push('S3_ACCESS_KEY');
    if (!s3.secretKey) missingS3.push('S3_SECRET_KEY');
    if (!s3.bucket) missingS3.push('S3_BUCKET');
    if (!s3.region) missingS3.push('S3_REGION');

    for (const key of missingS3) {
      console.error(`❌ S3 is enabled but ${key} is missing.`);
      failed = true;
    }
    if (!failed) {
      console.log('✅ S3 configuration is present.');
    }
  } else {
    console.warn('⚠️ Using Local Storage Provider. Not recommended for production/stateless environments.');
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
