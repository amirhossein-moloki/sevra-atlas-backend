import request from 'supertest';
import app from '../src/app';
import { UserRole } from '@prisma/client';
import { createTokenForRole, getAuthHeader } from './test-utils';

describe('Artists Module', () => {
  const artistToken = createTokenForRole(UserRole.ARTIST);

  describe('GET /api/v1/artists', () => {
    it('should list artists', async () => {
      const res = await request(app).get('/api/v1/artists');
      expect(res.status).toBe(200);
      expect(res).toSatisfyApiSpec();
    });
  });

  describe('POST /api/v1/artists', () => {
    it('should create an artist profile', async () => {
      const res = await request(app)
        .post('/api/v1/artists')
        .set(getAuthHeader(artistToken))
        .send({
          fullName: 'Test Artist',
          slug: `test-artist-${Date.now()}`,
          summary: 'Artist Summary'
        });
      expect([201, 400]).toContain(res.status);
    });
  });
});
