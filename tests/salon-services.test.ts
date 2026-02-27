import request from 'supertest';
import app from '../src/app';
import { prisma } from '../src/shared/db/prisma';
import { generateAccessToken } from '../src/shared/auth/jwt';
import { UserRole } from '@prisma/client';
import { generateUniquePhone, generateUniqueUsername } from './test-utils';

describe('Salon Services API', () => {
  let salonToken: string;
  let salonId: string;
  let salonSlug: string;
  let serviceId: string;
  let otherServiceId: string;

  beforeAll(async () => {
    // Setup Geography
    const province = await prisma.province.upsert({
      where: { slug: 'tehran-services' },
      update: {},
      create: { nameFa: 'تهران', slug: 'tehran-services' }
    });
    const city = await prisma.city.upsert({
      where: { provinceId_slug: { provinceId: province.id, slug: 'tehran-services' } },
      update: {},
      create: { provinceId: province.id, nameFa: 'تهران', slug: 'tehran-services' }
    });

    // Setup User
    const user = await prisma.user.create({
      data: {
        phoneNumber: generateUniquePhone(),
        username: generateUniqueUsername('service_owner'),
        firstName: 'Service',
        lastName: 'Owner',
        email: `service_owner_${Date.now()}@test.com`,
        isStaff: false,
        isActive: true,
        role: UserRole.SALON,
        referralCode: 'SRV' + Date.now().toString().slice(-5)
      }
    });
    salonToken = generateAccessToken({ sub: user.id.toString(), role: UserRole.SALON });

    // Setup Salon
    const salon = await prisma.salon.create({
      data: {
        name: 'Service Test Salon',
        slug: 'service-test-salon-' + Date.now(),
        cityId: city.id,
        primaryOwnerId: user.id,
        owners: { connect: { id: user.id } },
        status: 'ACTIVE'
      }
    });
    salonId = salon.id.toString();
    salonSlug = salon.slug;

    // Setup Service Category and Definitions
    const category = await prisma.serviceCategory.create({
      data: { nameFa: 'مو', slug: 'hair-' + Date.now() }
    });
    const service = await prisma.serviceDefinition.create({
      data: { categoryId: category.id, nameFa: 'کوتاهی', slug: 'haircut-' + Date.now() }
    });
    const otherService = await prisma.serviceDefinition.create({
      data: { categoryId: category.id, nameFa: 'رنگ', slug: 'hair-color-' + Date.now() }
    });
    serviceId = service.id.toString();
    otherServiceId = otherService.id.toString();
  });

  afterAll(async () => {
    await prisma.salonService.deleteMany({ where: { salonId: BigInt(salonId) } });
    await prisma.salon.deleteMany({ where: { id: BigInt(salonId) } });
    // Not deleting everything else to avoid breaking concurrent tests, but cleanup is good
  });

  it('GET /salons/:id/services should return empty list for new salon', async () => {
    const res = await request(app).get(`/api/v1/salons/${salonSlug}/services`);
    expect(res.status).toBe(200);
    expect(res.body.data).toBeInstanceOf(Array);
    expect(res.body.data.length).toBe(0);
  });

  it('PUT /salons/:id/services should bulk upsert services', async () => {
    const res = await request(app)
      .put(`/api/v1/salons/${salonId}/services`)
      .set('Authorization', `Bearer ${salonToken}`)
      .send({
        services: [
          {
            serviceId: serviceId,
            minPriceToman: '100000',
            maxPriceToman: '200000',
            minDurationMin: 30,
            maxDurationMin: 60,
            isActive: true
          }
        ]
      });

    expect(res.status).toBe(200);
    expect(res.body.data.ok).toBe(true);

    const getRes = await request(app).get(`/api/v1/salons/${salonSlug}/services`);
    expect(getRes.body.data.length).toBe(1);
    const service = getRes.body.data[0].services[0];
    expect(service.serviceId).toBe(serviceId);
    expect(service.minPriceToman).toBe('100000');
    expect(service.maxPriceToman).toBe('200000');
    expect(service.minDurationMin).toBe(30);
    expect(service.maxDurationMin).toBe(60);
  });

  it('PUT should fail if minPriceToman > maxPriceToman', async () => {
    const res = await request(app)
      .put(`/api/v1/salons/${salonId}/services`)
      .set('Authorization', `Bearer ${salonToken}`)
      .send({
        services: [
          {
            serviceId: serviceId,
            minPriceToman: '300000',
            maxPriceToman: '200000'
          }
        ]
      });

    expect(res.status).toBe(400);
  });

  it('PUT with replace=true should remove missing services', async () => {
    // First, ensure we have two services
    await request(app)
      .put(`/api/v1/salons/${salonId}/services`)
      .set('Authorization', `Bearer ${salonToken}`)
      .send({
        services: [
          { serviceId: serviceId, minPriceToman: '100000', maxPriceToman: '200000' },
          { serviceId: otherServiceId, minPriceToman: '50000', maxPriceToman: '80000' }
        ]
      });

    const getResBefore = await request(app).get(`/api/v1/salons/${salonSlug}/services`);
    // Might be in one group or two, let's count total services
    const totalServicesBefore = getResBefore.body.data.reduce((acc: number, group: any) => acc + group.services.length, 0);
    expect(totalServicesBefore).toBe(2);

    // Now replace with only one
    await request(app)
      .put(`/api/v1/salons/${salonId}/services?replace=true`)
      .set('Authorization', `Bearer ${salonToken}`)
      .send({
        services: [
          { serviceId: serviceId, minPriceToman: '150000', maxPriceToman: '250000' }
        ]
      });

    const getResAfter = await request(app).get(`/api/v1/salons/${salonSlug}/services`);
    const totalServicesAfter = getResAfter.body.data.reduce((acc: number, group: any) => acc + group.services.length, 0);
    expect(totalServicesAfter).toBe(1);
    expect(getResAfter.body.data[0].services[0].serviceId).toBe(serviceId);
    expect(getResAfter.body.data[0].services[0].minPriceToman).toBe('150000');
  });

  it('PUT with append mode should not remove existing services', async () => {
     await request(app)
      .put(`/api/v1/salons/${salonId}/services?mode=append`)
      .set('Authorization', `Bearer ${salonToken}`)
      .send({
        services: [
          { serviceId: otherServiceId, minPriceToman: '60000', maxPriceToman: '90000' }
        ]
      });

    const getRes = await request(app).get(`/api/v1/salons/${salonSlug}/services`);
    const totalServices = getRes.body.data.reduce((acc: number, group: any) => acc + group.services.length, 0);
    expect(totalServices).toBe(2);
  });
});
