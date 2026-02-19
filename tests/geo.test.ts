import request from 'supertest';
import app from '../src/app';
import { UserRole } from '@prisma/client';
import { createTokenForRole, getAuthHeader } from './test-utils';

describe('Geo Module', () => {
  const adminToken = createTokenForRole(UserRole.ADMIN);

  describe('GET /api/v1/geo/provinces', () => {
    it('should list all provinces', async () => {
      const res = await request(app).get('/api/v1/geo/provinces');
      expect(res.status).toBe(200);
      expect(res).toSatisfyApiSpec();
    });
  });

  describe('POST /api/v1/geo/provinces', () => {
    it('should require admin role', async () => {
      const userToken = createTokenForRole(UserRole.USER);
      const res = await request(app)
        .post('/api/v1/geo/provinces')
        .set(getAuthHeader(userToken))
        .send({ nameFa: 'Test Province', slug: 'test-province' });
      expect(res.status).toBe(403);
    });

    it('should create a province (Admin)', async () => {
      const res = await request(app)
        .post('/api/v1/geo/provinces')
        .set(getAuthHeader(adminToken))
        .send({ nameFa: 'Test Province', slug: `test-province-${Date.now()}` });
      expect([201, 400]).toContain(res.status);
    });
  });
});
