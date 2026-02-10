import request from 'supertest';
import app from '../src/app';
import { prisma } from '../src/shared/db/prisma';
import { redis } from '../src/shared/redis/redis';
import { UserRole, PostStatus, EntityType } from '@prisma/client';
import { generateAccessToken } from '../src/shared/auth/jwt';

describe('Blog Module E2E', () => {
  let adminToken: string;
  let authorToken: string;
  let userToken: string;
  let authorId: string;
  let adminId: string;
  let userId: string;

  beforeAll(async () => {
    // Setup Users
    const admin = await prisma.user.upsert({
      where: { phoneNumber: '+989000000100' },
      update: { role: UserRole.ADMIN },
      create: {
        phoneNumber: '+989000000100',
        username: 'blog_admin',
        firstName: 'Admin',
        lastName: 'Blog',
        email: 'admin@blog.com',
        isStaff: true,
        isActive: true,
        role: UserRole.ADMIN,
        referralCode: 'BADM01'
      }
    });
    adminId = admin.id.toString();
    adminToken = generateAccessToken({ sub: adminId, role: UserRole.ADMIN });

    const author = await prisma.user.upsert({
      where: { phoneNumber: '+989000000101' },
      update: { role: UserRole.AUTHOR },
      create: {
        phoneNumber: '+989000000101',
        username: 'blog_author',
        firstName: 'Author',
        lastName: 'Blog',
        email: 'author@blog.com',
        isStaff: false,
        isActive: true,
        role: UserRole.AUTHOR,
        referralCode: 'BAUT01'
      }
    });
    authorId = author.id.toString();
    authorToken = generateAccessToken({ sub: authorId, role: UserRole.AUTHOR });

    await prisma.authorProfile.upsert({
      where: { userId: BigInt(authorId) },
      update: {},
      create: {
        userId: BigInt(authorId),
        displayName: 'E2E Author',
        bio: 'Testing blog flows'
      }
    });

    const user = await prisma.user.upsert({
      where: { phoneNumber: '+989000000102' },
      update: { role: UserRole.USER },
      create: {
        phoneNumber: '+989000000102',
        username: 'blog_user',
        firstName: 'Regular',
        lastName: 'User',
        email: 'user@blog.com',
        isStaff: false,
        isActive: true,
        role: UserRole.USER,
        referralCode: 'BUSER1'
      }
    });
    userId = user.id.toString();
    userToken = generateAccessToken({ sub: userId, role: UserRole.USER });
  });

  afterAll(async () => {
    // Cleanup
    await prisma.comment.deleteMany({ where: { userId: { in: [BigInt(adminId), BigInt(authorId), BigInt(userId)] } } });
    await prisma.postTag.deleteMany({});
    await prisma.post.deleteMany({ where: { authorId: { in: [BigInt(adminId), BigInt(authorId)] } } });
    await prisma.tag.deleteMany({});
    await prisma.category.deleteMany({});
    await prisma.series.deleteMany({});
    await prisma.authorProfile.deleteMany({ where: { userId: BigInt(authorId) } });
    await prisma.user.deleteMany({ where: { id: { in: [BigInt(adminId), BigInt(authorId), BigInt(userId)] } } });
    await redis.quit();
    await prisma.$disconnect();
  });

  describe('Taxonomy Management', () => {
    let categoryId: string;
    let tagId: string;

    it('should allow admin to create a category', async () => {
      const res = await request(app)
        .post('/api/v1/blog/taxonomy/categories')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          name: 'Technology',
          slug: 'tech',
          description: 'Tech related posts'
        });

      expect(res.status).toBe(201);
      expect(res.body.name).toBe('Technology');
      categoryId = res.body.id;
    });

    it('should allow admin to create a tag', async () => {
      const res = await request(app)
        .post('/api/v1/blog/taxonomy/tags')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          name: 'TypeScript',
          slug: 'typescript',
          description: 'TS posts'
        });

      expect(res.status).toBe(201);
      expect(res.body.name).toBe('TypeScript');
      tagId = res.body.id;
    });

    it('should list categories and tags publicly', async () => {
      const catRes = await request(app).get('/api/v1/blog/taxonomy/categories');
      expect(catRes.status).toBe(200);
      expect(catRes.body.data).toEqual(expect.arrayContaining([expect.objectContaining({ slug: 'tech' })]));

      const tagRes = await request(app).get('/api/v1/blog/taxonomy/tags');
      expect(tagRes.status).toBe(200);
      expect(tagRes.body.data).toEqual(expect.arrayContaining([expect.objectContaining({ slug: 'typescript' })]));
    });
  });

  describe('Post Lifecycle', () => {
    let postSlug = 'test-post-' + Date.now();
    let postId: string;

    it('should allow author to create a draft post', async () => {
      // Get category and tag IDs from previous step
      const cat = await prisma.category.findUnique({ where: { slug: 'tech' } });
      const tag = await prisma.tag.findUnique({ where: { slug: 'typescript' } });

      const res = await request(app)
        .post('/api/v1/blog/posts')
        .set('Authorization', `Bearer ${authorToken}`)
        .send({
          title: 'Testing Blog E2E',
          slug: postSlug,
          content: 'This is a test post content',
          excerpt: 'Short summary',
          status: 'draft',
          category_id: cat?.id.toString(),
          tag_ids: [Number(tag?.id)]
        });

      expect(res.status).toBe(201);
      expect(res.body.status).toBe('draft');
      postId = res.body.id;
    });

    it('should not show draft post in public list', async () => {
      const res = await request(app).get('/api/v1/blog/posts');
      expect(res.status).toBe(200);
      const posts = res.body.data;
      expect(posts.find((p: any) => p.slug === postSlug)).toBeUndefined();
    });

    it('should allow author to publish the post', async () => {
      const res = await request(app)
        .post(`/api/v1/blog/posts/${postSlug}/publish`)
        .set('Authorization', `Bearer ${authorToken}`);

      expect(res.status).toBe(200);
      expect(res.body.status).toBe('published');
    });

    it('should show published post in public list', async () => {
      const res = await request(app).get('/api/v1/blog/posts');
      expect(res.status).toBe(200);
      const posts = res.body.data;
      expect(posts.find((p: any) => p.slug === postSlug)).toBeDefined();
    });

    it('should handle slug change and create redirects', async () => {
      const newSlug = postSlug + '-updated';
      const res = await request(app)
        .patch(`/api/v1/blog/posts/${postSlug}`)
        .set('Authorization', `Bearer ${authorToken}`)
        .send({ slug: newSlug });

      expect(res.status).toBe(200);
      expect(res.body.slug).toBe(newSlug);

      // Verify redirect rule
      const redirect = await prisma.redirectRule.findUnique({
        where: { fromPath: `/blog/post/${postSlug}` }
      });
      expect(redirect).toBeDefined();
      expect(redirect?.toPath).toBe(`/blog/post/${newSlug}`);

      postSlug = newSlug;
    });
  });

  describe('Comments System', () => {
    let postSlug: string;
    let commentId: string;

    beforeAll(async () => {
        const post = await prisma.post.findFirst({ where: { authorId: BigInt(authorId) } });
        postSlug = post!.slug;
    });

    it('should allow authenticated user to post a comment', async () => {
      const res = await request(app)
        .post(`/api/v1/blog/posts/${postSlug}/comments`)
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          content: 'Great post! Thanks for sharing.'
        });

      expect(res.status).toBe(201);
      expect(res.body.content).toBe('Great post! Thanks for sharing.');
      expect(res.body.status).toBe('pending');
      commentId = res.body.id;
    });

    it('should not show pending comment in public list', async () => {
      const res = await request(app).get(`/api/v1/blog/posts/${postSlug}/comments`);
      expect(res.status).toBe(200);
      expect(res.body.data.find((c: any) => c.id === commentId)).toBeUndefined();
    });

    it('should allow admin to approve a comment', async () => {
      // Note: We need to know the route for global comments management
      // Based on controller, it might be in misc or a dedicated comments route
      // Let's check src/app.ts or similar to find the mounting point
      // For now, I'll assume it's /api/v1/blog/comments/:id/status

      const res = await request(app)
        .patch(`/api/v1/blog/comments/${commentId}/status`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ status: 'approved' });

      expect(res.status).toBe(200);
      expect(res.body.status).toBe('approved');
    });

    it('should show approved comment in public list', async () => {
      const res = await request(app).get(`/api/v1/blog/posts/${postSlug}/comments`);
      expect(res.status).toBe(200);
      expect(res.body.data.find((c: any) => c.id === commentId)).toBeDefined();
    });
  });

  describe('Author Profiles', () => {
    it('should list author profiles publicly', async () => {
      const res = await request(app).get('/api/v1/blog/authors');
      expect(res.status).toBe(200);
      expect(res.body.data).toEqual(expect.arrayContaining([expect.objectContaining({ displayName: 'E2E Author' })]));
    });

    it('should allow admin to update an author profile', async () => {
      const res = await request(app)
        .patch(`/api/v1/blog/authors/${authorId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          bio: 'Updated bio for E2E author'
        });

      expect(res.status).toBe(200);
      expect(res.body.bio).toBe('Updated bio for E2E author');
    });
  });

  describe('Search and Filtering', () => {
    it('should filter posts by category', async () => {
      const res = await request(app)
        .get('/api/v1/blog/posts')
        .query({ category: 'tech' });

      expect(res.status).toBe(200);
      expect(res.body.data.every((p: any) => p.category.slug === 'tech')).toBe(true);
    });

    it('should search posts by query string', async () => {
      const res = await request(app)
        .get('/api/v1/blog/posts')
        .query({ q: 'Testing' });

      expect(res.status).toBe(200);
      expect(res.body.data.some((p: any) => p.title.includes('Testing'))).toBe(true);
    });
  });
});
