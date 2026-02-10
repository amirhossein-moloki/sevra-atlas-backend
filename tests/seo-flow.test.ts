import request from 'supertest';
import app from '../src/app';
import { prisma } from '../src/shared/db/prisma';
import { generateAccessToken } from '../src/shared/auth/jwt';
import { UserRole, EntityType, PostStatus } from '@prisma/client';

describe('SEO Flow E2E', () => {
  let adminToken: string;

  beforeAll(async () => {
    adminToken = generateAccessToken({ sub: '1', role: UserRole.ADMIN });

    // We try to ensure admin user exists, but this might fail if no DB
    try {
        await prisma.user.upsert({
            where: { id: BigInt(1) },
            update: { role: UserRole.ADMIN, isActive: true },
            create: {
              id: BigInt(1),
              username: 'admin',
              phoneNumber: '+989000000001',
              firstName: 'Admin',
              lastName: 'User',
              email: 'admin@test.com',
              isStaff: true,
              isActive: true,
              role: UserRole.ADMIN,
              referralCode: 'ADMIN1'
            }
          });
    } catch (e) {
        console.warn('Could not connect to DB for test setup, tests might fail');
    }
  });

  it('should handle slug change for a Salon correctly', async () => {
    const oldSlug = 'old-salon-slug-' + Date.now();
    const newSlug = 'new-salon-slug-' + Date.now();

    // 1. Create a salon
    const salon = await prisma.salon.create({
      data: {
        name: 'Test Salon',
        slug: oldSlug,
        owners: { connect: { id: BigInt(1) } }
      }
    });

    // 2. Add to sitemap
    await prisma.sitemapUrl.create({
      data: {
        path: `/atlas/salon/${oldSlug}`,
        entityType: EntityType.SALON,
        entityId: salon.id
      }
    });

    // 3. Update slug via API
    const res = await request(app)
      .patch(`/api/v1/salons/${salon.id}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ slug: newSlug });

    expect(res.status).toBe(200);

    // 4. Verify SlugHistory
    const history = await prisma.slugHistory.findFirst({
      where: { entityType: EntityType.SALON, entityId: salon.id, oldSlug }
    });
    expect(history).toBeDefined();
    expect(history?.newSlug).toBe(newSlug);

    // 5. Verify RedirectRule
    const redirect = await prisma.redirectRule.findUnique({
      where: { fromPath: `/atlas/salon/${oldSlug}` }
    });
    expect(redirect).toBeDefined();
    expect(redirect?.toPath).toBe(`/atlas/salon/${newSlug}`);

    // 6. Verify SitemapUrl update
    const sitemap = await prisma.sitemapUrl.findFirst({
      where: { entityType: EntityType.SALON, entityId: salon.id }
    });
    expect(sitemap?.path).toBe(`/atlas/salon/${newSlug}`);
  });

  it('should handle slug change for a Blog Post correctly', async () => {
      const oldSlug = 'old-post-slug-' + Date.now();
      const newSlug = 'new-post-slug-' + Date.now();

      await prisma.authorProfile.upsert({
          where: { userId: BigInt(1) },
          update: {},
          create: { userId: BigInt(1), displayName: 'Admin Author', bio: 'Bio' }
      });

      const post = await prisma.post.create({
          data: {
              title: 'Test Post',
              slug: oldSlug,
              excerpt: 'Excerpt',
              content: 'Content',
              authorId: BigInt(1),
              status: PostStatus.published
          }
      });

      await prisma.sitemapUrl.create({
          data: {
              path: `/blog/post/${oldSlug}`,
              entityType: EntityType.BLOG_POST,
              entityId: post.id
          }
      });

      const res = await request(app)
        .patch(`/api/v1/blog/posts/${oldSlug}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ slug: newSlug });

      expect(res.status).toBe(200);

      const redirect = await prisma.redirectRule.findUnique({
          where: { fromPath: `/blog/post/${oldSlug}` }
      });
      expect(redirect).toBeDefined();
      expect(redirect?.toPath).toBe(`/blog/post/${newSlug}`);

      const sitemap = await prisma.sitemapUrl.findFirst({
          where: { entityType: EntityType.BLOG_POST, entityId: post.id }
      });
      expect(sitemap?.path).toBe(`/blog/post/${newSlug}`);
  });
});
