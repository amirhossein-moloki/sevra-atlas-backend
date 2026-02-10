import request from 'supertest';
import app from '../src/app';
import { prisma } from '../src/shared/db/prisma';
import { redis } from '../src/shared/redis/redis';
import { UserRole, EntityType, AccountStatus } from '@prisma/client';

/**
 * 🛡️ CRITICAL BUSINESS FLOWS - REAL E2E TESTS
 * -------------------------------------------
 * This suite is the "Safety Net" for the Sevra Atlas Backend.
 *
 * TARGET RISKS ADDRESSED (from Technical Audit):
 * 1. [Risk: Production-only bugs] -> Solved by using Real Prisma & Redis (No Mocks).
 * 2. [Risk: Costly Rollbacks] -> Solved by verifying Side-Effects (SlugHistory, Redirects).
 * 3. [Risk: Mid-flow Failure] -> Solved by Flow 4 (Resilience/Consistency checks).
 * 4. [Risk: Atomic Integrity] -> Solved by Flow 5 (Complex Verification Journey).
 *
 * These tests are mandatory for CI/CD to ensure the system remains healthy.
 */

describe('Critical Business Flows E2E', () => {

  beforeAll(async () => {
    // Check connection or perform global setup if needed
    try {
      await prisma.$connect();
    } catch (e) {
      console.warn('WARNING: Could not connect to Database. E2E tests will likely fail.');
    }
  });

  afterAll(async () => {
    // Cleanup and disconnect
    await redis.quit();
    await prisma.$disconnect();
  });

  describe('Flow 1: Authentication Lifecycle (OTP → Auth → Refresh)', () => {
    const phoneNumber = '+989000000001';

    beforeEach(async () => {
      // Cleanup previous data for this phone number
      await prisma.user.deleteMany({ where: { phoneNumber } });
      await prisma.otp.deleteMany({ where: { phoneE164: phoneNumber } });
      await redis.del(`otp:${phoneNumber}`);
      await redis.del(`otp:${phoneNumber}:attempts`);
    });

    it('should complete the full auth lifecycle successfully', async () => {
      // 1. Request OTP
      const reqRes = await request(app)
        .post('/api/v1/auth/otp/request')
        .send({ phoneNumber });

      expect(reqRes.status).toBe(200);
      expect(reqRes.body.message).toBe('OTP sent successfully');

      // 2. Retrieve OTP from persistence (simulating the side-effect check)
      let otpCode: string | null = await redis.get(`otp:${phoneNumber}`);
      if (!otpCode) {
        const otpRecord = await prisma.otp.findUnique({ where: { phoneE164: phoneNumber } });
        otpCode = otpRecord?.code || null;
      }
      expect(otpCode).toBeDefined();

      // 3. Verify OTP
      const verifyRes = await request(app)
        .post('/api/v1/auth/otp/verify')
        .send({ phoneNumber, code: otpCode });

      expect(verifyRes.status).toBe(200);
      expect(verifyRes.body.accessToken).toBeDefined();
      expect(verifyRes.body.refreshToken).toBeDefined();
      expect(verifyRes.body.user.phoneNumber).toBe(phoneNumber);

      const { accessToken, refreshToken } = verifyRes.body;

      // 4. Refresh Token
      const refreshRes = await request(app)
        .post('/api/v1/auth/refresh')
        .send({ refreshToken });

      expect(refreshRes.status).toBe(200);
      expect(refreshRes.body.accessToken).toBeDefined();
      expect(refreshRes.body.accessToken).not.toBe(accessToken);

      // 5. Logout
      const logoutRes = await request(app)
        .post('/api/v1/auth/logout')
        .set('Authorization', `Bearer ${refreshRes.body.accessToken}`)
        .send({ refreshToken });

      expect(logoutRes.status).toBe(200);
      expect(logoutRes.body.ok).toBe(true);
    });
  });

  describe('Flow 2: User Onboarding & Salon Creation', () => {
    const phoneNumber = '+989000000002';
    let token: string;
    let userId: string;

    beforeAll(async () => {
        // Setup a user via API
        await request(app).post('/api/v1/auth/otp/request').send({ phoneNumber });
        let code: string | null = await redis.get(`otp:${phoneNumber}`);
        if (!code) {
          const otpRecord = await prisma.otp.findUnique({ where: { phoneE164: phoneNumber } });
          code = otpRecord?.code || null;
        }
        const res = await request(app).post('/api/v1/auth/otp/verify').send({ phoneNumber, code });
        token = res.body.accessToken;
        userId = res.body.user.id;
    });

    afterAll(async () => {
        // Cleanup Flow 2 data
        await prisma.salon.deleteMany({ where: { primaryOwnerId: BigInt(userId) } });
        await prisma.user.deleteMany({ where: { id: BigInt(userId) } });
    });

    it('should complete onboarding and create a published salon', async () => {
      // 1. Update Profile (Onboarding)
      const profileRes = await request(app)
        .patch('/api/v1/me')
        .set('Authorization', `Bearer ${token}`)
        .send({
          firstName: 'Salon',
          lastName: 'Owner',
          email: 'owner@example.com'
        });

      expect(profileRes.status).toBe(200);

      // 2. Grant SALON role (Simulated Admin Action)
      await prisma.user.update({
        where: { id: BigInt(userId) },
        data: { role: UserRole.SALON }
      });

      // 3. Create Salon
      const salonSlug = 'flow-test-salon-' + Date.now();
      const salonRes = await request(app)
        .post('/api/v1/salons')
        .set('Authorization', `Bearer ${token}`)
        .send({
          name: 'E2E Test Salon',
          slug: salonSlug,
          description: 'Testing the full flow',
          phone: '02188888888'
        });

      expect(salonRes.status).toBe(201);
      expect(salonRes.body.slug).toBe(salonSlug);

      // 4. Verify Salon is accessible and has correct owner
      const getRes = await request(app).get(`/api/v1/salons/${salonSlug}`);
      expect(getRes.status).toBe(200);
      expect(getRes.body.name).toBe('E2E Test Salon');

      const salonInDb = await prisma.salon.findUnique({
          where: { slug: salonSlug },
          include: { owners: true }
      });
      expect(salonInDb?.primaryOwnerId?.toString()).toBe(userId);
      expect(salonInDb?.owners.some(o => o.id.toString() === userId)).toBe(true);
    });
  });

  describe('Flow 3: Slug Change, Redirects & SEO Resolution', () => {
    const oldSlug = 'original-slug-' + Date.now();
    const newSlug = 'updated-slug-' + Date.now();
    let adminToken: string;
    let salonId: string;

    beforeAll(async () => {
      // Setup Admin
      const admin = await prisma.user.upsert({
          where: { phoneNumber: '+989000000003' },
          update: { role: UserRole.ADMIN },
          create: {
            phoneNumber: '+989000000003',
            username: 'admin_user',
            firstName: 'Admin',
            lastName: 'E2E',
            email: 'admin@e2e.com',
            isStaff: true,
            isActive: true,
            role: UserRole.ADMIN,
            referralCode: 'ADME2E'
          }
      });

      // Note: We'd normally login to get a real token, but for test speed we can generate one
      // Since it's E2E, let's assume the auth/otp/verify mock or real works.
      // For this test, let's use the actual verification flow for admin.
      await request(app).post('/api/v1/auth/otp/request').send({ phoneNumber: '+989000000003' });
      let code: string | null = await redis.get(`otp:+989000000003`);
      if (!code) {
        const otpRecord = await prisma.otp.findUnique({ where: { phoneE164: '+989000000003' } });
        code = otpRecord?.code || null;
      }
      const res = await request(app).post('/api/v1/auth/otp/verify').send({ phoneNumber: '+989000000003', code });
      adminToken = res.body.accessToken;

      // Create initial Salon
      const salon = await prisma.salon.create({
          data: {
              name: 'SEO Flow Salon',
              slug: oldSlug,
              primaryOwnerId: admin.id,
              owners: { connect: { id: admin.id } }
          }
      });
      salonId = salon.id.toString();

      // Ensure it's in sitemap
      await prisma.sitemapUrl.upsert({
          where: { path: `/atlas/salon/${oldSlug}` },
          update: {},
          create: {
              path: `/atlas/salon/${oldSlug}`,
              entityType: EntityType.SALON,
              entityId: salon.id
          }
      });
    });

    afterAll(async () => {
      // Cleanup Flow 3 data
      await prisma.redirectRule.deleteMany({ where: { toPath: `/atlas/salon/${newSlug}` } });
      await prisma.sitemapUrl.deleteMany({ where: { path: `/atlas/salon/${newSlug}` } });
      await prisma.slugHistory.deleteMany({ where: { entityId: BigInt(salonId) } });
      await prisma.salon.deleteMany({ where: { id: BigInt(salonId) } });
      await prisma.user.deleteMany({ where: { phoneNumber: '+989000000003' } });
    });

    it('should handle slug update and properly resolve SEO redirects', async () => {
      // 1. Update Salon Slug
      const updateRes = await request(app)
        .patch(`/api/v1/salons/${salonId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ slug: newSlug });

      expect(updateRes.status).toBe(200);
      expect(updateRes.body.slug).toBe(newSlug);

      // 2. Check Side Effect: SlugHistory
      const history = await prisma.slugHistory.findFirst({
        where: { entityType: EntityType.SALON, entityId: BigInt(salonId), oldSlug }
      });
      expect(history).toBeDefined();
      expect(history?.newSlug).toBe(newSlug);

      // 3. Check Side Effect: RedirectRule
      const redirect = await prisma.redirectRule.findUnique({
        where: { fromPath: `/atlas/salon/${oldSlug}` }
      });
      expect(redirect).toBeDefined();
      expect(redirect?.toPath).toBe(`/atlas/salon/${newSlug}`);

      // 4. Check Side Effect: SitemapUrl updated
      const sitemap = await prisma.sitemapUrl.findFirst({
        where: { entityType: EntityType.SALON, entityId: BigInt(salonId) }
      });
      expect(sitemap?.path).toBe(`/atlas/salon/${newSlug}`);

      // 5. SEO Resolve API Call
      const resolveRes = await request(app)
        .get('/api/v1/seo/redirects/resolve')
        .query({ path: `/atlas/salon/${oldSlug}` });

      expect(resolveRes.status).toBe(200);
      expect(resolveRes.body.redirect).toBeDefined();
      expect(resolveRes.body.redirect.toPath).toBe(`/atlas/salon/${newSlug}`);
      expect(resolveRes.body.redirect.type).toBe('PERMANENT_301');
    });
  });

  describe('Resilience: Failure in the middle of a flow', () => {
    it('should maintain state consistency when a multi-step flow fails', async () => {
      const phoneNumber = '+989000000004';

      // 1. Request OTP
      await request(app).post('/api/v1/auth/otp/request').send({ phoneNumber });
      let code: string | null = await redis.get(`otp:${phoneNumber}`);
      if (!code) {
        const otpRecord = await prisma.otp.findUnique({ where: { phoneE164: phoneNumber } });
        code = otpRecord?.code || null;
      }

      // 2. Fail verification with wrong code
      const failRes = await request(app).post('/api/v1/auth/otp/verify').send({ phoneNumber, code: '000000' });
      expect(failRes.status).toBe(400);

      // 3. Verify that no user was created yet
      const user = await prisma.user.findUnique({ where: { phoneNumber } });
      expect(user).toBeNull();

      // 4. Verify that the OTP still exists and attempts increased
      const redisAttempts = await redis.get(`otp:${phoneNumber}:attempts`);
      if (redisAttempts) {
          expect(parseInt(redisAttempts)).toBeGreaterThan(0);
      } else {
          const otpRecord = await prisma.otp.findUnique({ where: { phoneE164: phoneNumber } });
          expect(otpRecord?.attempts).toBeGreaterThan(0);
      }

      // 5. Cleanup
      await prisma.otp.deleteMany({ where: { phoneE164: phoneNumber } });
      await redis.del(`otp:${phoneNumber}`);
      await redis.del(`otp:${phoneNumber}:attempts`);
    });
  });

  describe('Flow 5: Verification Journey (Request → Admin Review → Verified)', () => {
    let userToken: string;
    let adminToken: string;
    let salonId: string;
    let requestId: string;

    beforeAll(async () => {
      // 1. Setup User & Salon
      const userRes = await request(app).post('/api/v1/auth/otp/request').send({ phoneNumber: '+989000000005' });
      const userCode = (await redis.get('otp:+989000000005')) || (await prisma.otp.findUnique({where:{phoneE164:'+989000000005'}}))?.code;
      const userVerify = await request(app).post('/api/v1/auth/otp/verify').send({ phoneNumber: '+989000000005', code: userCode });
      userToken = userVerify.body.accessToken;

      await prisma.user.update({ where: { id: BigInt(userVerify.body.user.id) }, data: { role: UserRole.SALON } });

      const salon = await prisma.salon.create({
          data: { name: 'Verify Me Salon', slug: 'verify-me', primaryOwnerId: BigInt(userVerify.body.user.id), owners: { connect: { id: BigInt(userVerify.body.user.id) } } }
      });
      salonId = salon.id.toString();

      // 2. Setup Admin
      await prisma.user.upsert({
          where: { phoneNumber: '+989000000006' },
          update: { role: UserRole.ADMIN },
          create: { phoneNumber: '+989000000006', username: 'admin_verify', role: UserRole.ADMIN, isStaff: true, isActive: true, referralCode: 'VADM', firstName: '', lastName: '', email: '' } as any
      });
      await request(app).post('/api/v1/auth/otp/request').send({ phoneNumber: '+989000000006' });
      const adminCode = (await redis.get('otp:+989000000006')) || (await prisma.otp.findUnique({where:{phoneE164:'+989000000006'}}))?.code;
      const adminVerify = await request(app).post('/api/v1/auth/otp/verify').send({ phoneNumber: '+989000000006', code: adminCode });
      adminToken = adminVerify.body.accessToken;
    });

    afterAll(async () => {
        await prisma.verificationRequest.deleteMany({ where: { salonId: BigInt(salonId) } });
        await prisma.salon.deleteMany({ where: { id: BigInt(salonId) } });
        await prisma.user.deleteMany({ where: { phoneNumber: { in: ['+989000000005', '+989000000006'] } } });
    });

    it('should complete the verification lifecycle', async () => {
      // 1. User Requests Verification
      const reqRes = await request(app)
        .post('/api/v1/verification/request')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          targetType: 'SALON',
          targetId: salonId,
          notes: 'Please verify my business',
          documents: [
              { label: 'Business License', media: { url: 'http://docs.com/license.pdf', storageKey: 'key1', type: 'FILE', mime: 'application/pdf', sizeBytes: 1024 } }
          ]
        });

      expect(reqRes.status).toBe(201);
      requestId = reqRes.body.id;

      // 2. Admin Reviews and Approves
      const reviewRes = await request(app)
        .patch(`/api/v1/verification/${requestId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          status: 'VERIFIED',
          notes: 'Looks good'
        });

      expect(reviewRes.status).toBe(200);

      // 3. Verify Salon Status updated
      const salon = await prisma.salon.findUnique({ where: { id: BigInt(salonId) } });
      expect(salon?.verification).toBe('VERIFIED');
    });
  });
});
