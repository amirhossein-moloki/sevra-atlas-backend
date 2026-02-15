import request from 'supertest';
import app from '../src/app';
import { generateUniquePhone } from './test-utils';

describe('Auth Module', () => {
  const phoneNumber = generateUniquePhone();

  it('should request OTP successfully', async () => {
    const res = await request(app)
      .post('/api/v1/auth/otp/request')
      .send({ phoneNumber });

    expect(res.status).toBe(200);
    expect(res.body.data.message).toBe('OTP sent successfully');
  });

  it('should fail to verify with invalid code', async () => {
    const res = await request(app)
      .post('/api/v1/auth/otp/verify')
      .send({ phoneNumber, code: '000000' });

    expect(res.status).toBe(400);
  });
});
