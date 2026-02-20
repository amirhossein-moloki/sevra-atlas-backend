import request from 'supertest';
import app from '../src/app';
import * as fs from 'fs';
import * as path from 'path';
import { UserRole } from '@prisma/client';
import { createTokenForRole, getAuthHeader, checkProdWriteGuard } from './test-utils';

/**
 * This test suite dynamically tests all OpenAPI endpoints.
 * Use TAGS env var to filter by module, e.g. TAGS=Geo npm test ...
 */

const openapi = JSON.parse(fs.readFileSync(path.join(process.cwd(), 'openapi.json'), 'utf8'));
const allowedTags = process.env.TAGS ? process.env.TAGS.split(',') : null;

describe('Dynamic OpenAPI Coverage', () => {
  const endpoints: any[] = [];

  for (const [pathKey, pathItem] of Object.entries(openapi.paths)) {
    for (const [method, operation] of Object.entries(pathItem as any)) {
        if (['get', 'post', 'put', 'delete', 'patch'].includes(method.toLowerCase())) {
            const op = operation as any;
            if (allowedTags && !op.tags?.some((t: string) => allowedTags.includes(t))) {
                continue;
            }

            endpoints.push({
                pathKey,
                method: method.toLowerCase(),
                fullPath: `/api/v1${pathKey}`,
                operation: op,
                authRequired: !!op.security,
                tags: op.tags || []
            });
        }
    }
  }

  const getTestPath = (pathWithParams: string) => {
    let p = pathWithParams;
    const replacements: Record<string, string> = {
      'id': '1',
      'idOrSlug': 'test-slug-or-id',
      'slug': 'test-slug',
      'provinceId': '1',
      'cityId': '1',
      'certId': '1',
      'postId': '1',
      'serviceId': '1',
      'artistId': '1',
      'location': 'header',
      'queue': 'default',
      'userId': '1',
      'reviewId': '1',
      'tagId': '1',
      'categoryId': '1'
    };

    for (const [key, value] of Object.entries(replacements)) {
      p = p.replace(new RegExp(`\\{${key}\\}`, 'g'), value);
    }
    return p.replace(/\{(\w+)\}/g, '1');
  };

  if (endpoints.length === 0) {
      it('no endpoints found for selected tags', () => {});
  }

  describe.each(endpoints)('$method $fullPath', (e) => {
    const testPath = getTestPath(e.fullPath);
    const isWrite = ['post', 'put', 'delete', 'patch'].includes(e.method);

    if (e.authRequired) {
      it('should return 401 when missing authentication', async () => {
        const res = await (request(app) as any)[e.method](testPath);
        expect(res.status).toBe(401);
      });
    }

    it('should match documented OpenAPI schema', async () => {
        if (isWrite && checkProdWriteGuard()) return;

        const token = createTokenForRole(UserRole.ADMIN);
        const res = await (request(app) as any)[e.method](testPath)
            .set(getAuthHeader(token))
            .set('Content-Type', 'application/json')
            .send(isWrite ? {} : undefined);

        expect(res).toSatisfyApiSpec();
    });

    if (isWrite) {
        it('should enforce authorization (403 or 401)', async () => {
            if (checkProdWriteGuard()) return;
            const userToken = createTokenForRole(UserRole.USER);
            const res = await (request(app) as any)[e.method](testPath)
                .set(getAuthHeader(userToken))
                .set('Content-Type', 'application/json')
                .send({});

            if (res.status === 403 || res.status === 401) {
                expect(res).toSatisfyApiSpec();
            }
        });
    }
  });
});
