import request from 'supertest';
import app from '../src/app';
import { prisma } from '../src/shared/db/prisma';
import { generateAccessToken } from '../src/shared/auth/jwt';
import { UserRole } from '@prisma/client';
import { generateUniquePhone, generateUniqueUsername } from './test-utils';

describe('Salons & Permissions', () => {
  let adminToken: string;
  let salonToken: string;
  let userToken: string;
  let salonOwnerId: bigint;

  beforeAll(async () => {
    // Seed Geography for City 1
    const province = await prisma.province.upsert({
      where: { slug: 'tehran' },
      update: {},
      create: {
        id: BigInt(1),
        nameFa: 'تهران',
        slug: 'tehran'
      }
    });

    await prisma.city.upsert({
      where: { provinceId_slug: { provinceId: province.id, slug: 'tehran' } },
      update: {},
      create: {
        id: BigInt(1),
        provinceId: province.id,
        nameFa: 'تهران',
        slug: 'tehran'
      }
    });

    // Setup Admin
    const admin = await prisma.user.upsert({
      where: { phoneNumber: '+989000000001' },
      update: { role: UserRole.ADMIN },
      create: {
        phoneNumber: '+989000000001',
        username: 'admin_test',
        firstName: 'Admin',
        lastName: 'Test',
        email: 'admin@test.com',
        isStaff: true,
        isActive: true,
        role: UserRole.ADMIN,
        referralCode: 'ADMIN1'
      }
    });
    adminToken = generateAccessToken({ sub: admin.id.toString(), role: UserRole.ADMIN });

    // Setup User
    const user = await prisma.user.upsert({
      where: { phoneNumber: '+989000000002' },
      update: { role: UserRole.USER },
      create: {
        phoneNumber: '+989000000002',
        username: 'user_test',
        firstName: 'User',
        lastName: 'Test',
        email: 'user@test.com',
        isStaff: false,
        isActive: true,
        role: UserRole.USER,
        referralCode: 'USER1'
      }
    });
    userToken = generateAccessToken({ sub: user.id.toString(), role: UserRole.USER });

    // Setup Salon Owner
    const phone = generateUniquePhone();
    const salonOwner = await prisma.user.create({
      data: {
        phoneNumber: phone,
        username: generateUniqueUsername('owner'),
        firstName: 'Salon',
        lastName: 'Owner',
        email: `owner_${Date.now()}@test.com`,
        isStaff: false,
        isActive: true,
        role: UserRole.SALON,
        referralCode: 'SALON' + Date.now().toString().slice(-5)
      }
    });
    salonOwnerId = salonOwner.id;
    salonToken = generateAccessToken({ sub: salonOwner.id.toString(), role: UserRole.SALON });
  });

  afterAll(async () => {
    if (salonOwnerId) {
      await prisma.salon.deleteMany({ where: { primaryOwnerId: salonOwnerId } });
      await prisma.user.deleteMany({ where: { id: salonOwnerId } });
    }
    // We do NOT delete global test users (+989000000001, +989000000002)
    // as they are managed by setup-after-env.ts and used by other tests.
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
    const res = await request(app)
      .post('/api/v1/salons')
      .set('Authorization', `Bearer ${salonToken}`)
      .send({
        name: 'Test Salon',
        slug: 'test-salon-' + Date.now(),
        cityId: '1' // Assuming city 1 exists or use a valid ID
      });

    expect(res.status).toBe(201);
    expect(res.body.data.name).toBe('Test Salon');
  });
});
