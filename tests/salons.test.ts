import request from 'supertest';
import app from '../src/app';
import { prisma } from '../src/shared/db/prisma';
import { generateAccessToken } from '../src/shared/auth/jwt';
import { UserRole } from '@prisma/client';

describe('Salons & Permissions', () => {
  let adminToken: string;
  let salonToken: string;
  let userToken: string;

  beforeAll(async () => {
    adminToken = generateAccessToken({ sub: '1', role: UserRole.ADMIN });
    salonToken = generateAccessToken({ sub: '2', role: UserRole.SALON });
    userToken = generateAccessToken({ sub: '3', role: UserRole.USER });
  });

  it('should list salons', async () => {
    const res = await request(app).get('/api/v1/salons');
    expect(res.status).toBe(200);
    expect(res.body.data).toBeDefined();
  });

  it('should not allow normal user to create salon', async () => {
    const res = await request(app)
      .post('/api/v1/salons')
      .set('Authorization', `Bearer ${userToken}`)
      .send({ name: 'Test Salon', slug: 'test-salon' });

    expect(res.status).toBe(403);
  });

  it('should allow salon owner to create salon', async () => {
    // We mock the user in DB because of requireAuth logic
    await prisma.user.upsert({
      where: { id: BigInt(2) },
      update: { isActive: true, role: UserRole.SALON },
      create: { id: BigInt(2), username: 'salon_owner', phoneNumber: '+989000000000', firstName: 'Salon', lastName: 'Owner', email: 'salon@test.com', isStaff: false, isActive: true, role: UserRole.SALON, referralCode: 'SALON1' }
    });

    const res = await request(app)
      .post('/api/v1/salons')
      .set('Authorization', `Bearer ${salonToken}`)
      .send({ name: 'Test Salon', slug: 'test-salon' });

    expect(res.status).toBe(201);
  });
});
