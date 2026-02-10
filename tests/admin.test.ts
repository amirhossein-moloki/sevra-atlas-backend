import request from 'supertest';
import app from '../src/app';
import { prisma } from '../src/shared/db/prisma';
import { generateAccessToken } from '../src/shared/auth/jwt';
import { UserRole, VerificationStatus, EntityType, AccountStatus } from '@prisma/client';

describe('Admin Endpoints Stability', () => {
  let adminToken: string;
  let moderatorToken: string;
  let userToken: string;

  beforeAll(async () => {
    // Create users if they don't exist
    await prisma.user.upsert({
      where: { id: BigInt(100) },
      update: { role: UserRole.ADMIN, isActive: true },
      create: {
        id: BigInt(100),
        username: 'admin',
        phoneNumber: '+989000000100',
        firstName: 'Admin',
        lastName: 'User',
        email: 'admin@test.com',
        isStaff: true,
        isActive: true,
        role: UserRole.ADMIN,
        referralCode: 'ADMIN1'
      }
    });

    await prisma.user.upsert({
      where: { id: BigInt(101) },
      update: { role: UserRole.MODERATOR, isActive: true },
      create: {
        id: BigInt(101),
        username: 'moderator',
        phoneNumber: '+989000000101',
        firstName: 'Mod',
        lastName: 'User',
        email: 'mod@test.com',
        isStaff: true,
        isActive: true,
        role: UserRole.MODERATOR,
        referralCode: 'MOD1'
      }
    });

    await prisma.user.upsert({
        where: { id: BigInt(102) },
        update: { role: UserRole.USER, isActive: true },
        create: {
          id: BigInt(102),
          username: 'regular_user',
          phoneNumber: '+989000000102',
          firstName: 'Regular',
          lastName: 'User',
          email: 'user@test.com',
          isStaff: false,
          isActive: true,
          role: UserRole.USER,
          referralCode: 'USER1'
        }
      });

    adminToken = generateAccessToken({ sub: '100', role: UserRole.ADMIN });
    moderatorToken = generateAccessToken({ sub: '101', role: UserRole.MODERATOR });
    userToken = generateAccessToken({ sub: '102', role: UserRole.USER });
  });

  describe('SEO Meta Management', () => {
    it('should set SEO meta and link it to the salon as ADMIN', async () => {
      const salon = await prisma.salon.create({
        data: {
          name: 'SEO Test Salon',
          slug: 'seo-test-salon-' + Date.now(),
          status: AccountStatus.ACTIVE
        }
      });

      const res = await request(app)
        .post('/api/v1/seo/meta')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          entityType: EntityType.SALON,
          entityId: salon.id.toString(),
          title: 'SEO Title',
          description: 'SEO Description',
          ogTitle: 'OG Title',
          h1: 'H1 Title'
        });

      expect(res.status).toBe(200);

      const updatedSalon = await prisma.salon.findUnique({
        where: { id: salon.id },
        include: { seoMeta: true }
      });

      expect(updatedSalon?.seoMetaId).toBeDefined();
      expect(updatedSalon?.seoMeta?.title).toBe('SEO Title');
      expect(updatedSalon?.seoMeta?.h1).toBe('H1 Title');
    });

    it('should return error if entity does not exist', async () => {
        const res = await request(app)
          .post('/api/v1/seo/meta')
          .set('Authorization', `Bearer ${adminToken}`)
          .send({
            entityType: EntityType.SALON,
            entityId: '999999999',
            title: 'SEO Title'
          });

        expect(res.status).toBe(500); // Because we throw Error which becomes 500 in global handler
    });
  });

  describe('Sitemap Rebuild', () => {
    it('should rebuild sitemap as ADMIN', async () => {
      const res = await request(app)
        .post('/api/v1/seo/sitemap/rebuild')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({});

      expect(res.status).toBe(200);
      expect(res.body.rebuilt).toBeGreaterThanOrEqual(0);

      const count = await prisma.sitemapUrl.count();
      expect(count).toBe(res.body.rebuilt);
    });
  });

  describe('Verification Moderation', () => {
    let requestId: string;
    let salonId: bigint;

    beforeAll(async () => {
      const salon = await prisma.salon.create({
        data: {
          name: 'Verification Test Salon',
          slug: 'ver-test-salon-' + Date.now(),
          status: AccountStatus.ACTIVE,
          owners: { connect: { id: BigInt(102) } }
        }
      });
      salonId = salon.id;

      const vReq = await prisma.verificationRequest.create({
        data: {
          requestedById: BigInt(102),
          salonId: salon.id,
          status: VerificationStatus.PENDING,
          notes: 'Test request'
        }
      });
      requestId = vReq.id.toString();
    });

    it('should list verification requests as MODERATOR', async () => {
      const res = await request(app)
        .get('/api/v1/verification/requests')
        .set('Authorization', `Bearer ${moderatorToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data).toBeDefined();
    });

    it('should approve verification request and update salon status', async () => {
      const res = await request(app)
        .patch(`/api/v1/verification/${requestId}`)
        .set('Authorization', `Bearer ${moderatorToken}`)
        .send({
          status: VerificationStatus.VERIFIED,
          notes: 'Approved'
        });

      expect(res.status).toBe(200);
      expect(res.body.status).toBe(VerificationStatus.VERIFIED);

      const salon = await prisma.salon.findUnique({
          where: { id: salonId }
      });
      expect(salon?.verification).toBe(VerificationStatus.VERIFIED);
    });

    it('should not allow non-owner to request verification', async () => {
        const otherSalon = await prisma.salon.create({
            data: {
                name: 'Other Salon',
                slug: 'other-salon-' + Date.now(),
                status: AccountStatus.ACTIVE
            }
        });

        const res = await request(app)
          .post('/api/v1/verification/request')
          .set('Authorization', `Bearer ${userToken}`)
          .send({
            targetType: 'SALON',
            targetId: Number(otherSalon.id),
            documents: []
          });

        expect(res.status).toBe(403);
    });

    it('should not allow duplicate verification requests for same salon', async () => {
        const salon = await prisma.salon.create({
            data: {
                name: 'Duplicate Test Salon',
                slug: 'dup-test-salon-' + Date.now(),
                status: AccountStatus.ACTIVE,
                owners: { connect: { id: BigInt(102) } }
            }
        });

        // First request
        await request(app)
          .post('/api/v1/verification/request')
          .set('Authorization', `Bearer ${userToken}`)
          .send({
            targetType: 'SALON',
            targetId: Number(salon.id),
            documents: []
          });

        // Second request
        const res = await request(app)
          .post('/api/v1/verification/request')
          .set('Authorization', `Bearer ${userToken}`)
          .send({
            targetType: 'SALON',
            targetId: Number(salon.id),
            documents: []
          });

        expect(res.status).toBe(400);
    });
  });
});
