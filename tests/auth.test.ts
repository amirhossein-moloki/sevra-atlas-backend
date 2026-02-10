import request from 'supertest';
import app from '../src/app';
import { redis } from '../src/shared/redis/redis';
import { prisma } from '../src/shared/db/prisma';

describe('Auth Module', () => {
  beforeAll(async () => {
    // Basic cleanup or setup if needed
  });

  afterAll(async () => {
    await redis.quit();
    await prisma.$disconnect();
  });

  it('should request OTP successfully', async () => {
    const res = await request(app)
      .post('/api/v1/auth/otp/request')
      .send({ phoneNumber: '+989123456789' });

    expect(res.status).toBe(200);
    expect(res.body.message).toBe('OTP sent successfully');
  });

  it('should fail to verify with invalid code', async () => {
    const res = await request(app)
      .post('/api/v1/auth/otp/verify')
      .send({ phoneNumber: '+989123456789', code: '000000' });

    expect(res.status).toBe(400);
  });
});
