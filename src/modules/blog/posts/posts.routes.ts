import { Router } from 'express';
import { PostsController } from './posts.controller';
import { BlogCommentsController } from '../comments/comments.controller';
import { requireAuth, requireRole } from '../../../shared/middlewares/auth.middleware';
import { UserRole } from '@prisma/client';
import { validate } from '../../../shared/middlewares/validate.middleware';
import { createPostSchema, updatePostSchema } from './posts.validators';
import { createCommentSchema } from '../comments/comments.validators';
import { registry, z, withApiSuccess } from '../../../shared/openapi/registry';
import { BlogPostSchema, CommentSchema } from '../../../shared/openapi/schemas';

const router = Router();
const controller = new PostsController();
const commentsController = new BlogCommentsController();

const tag = 'Blog Posts';

registry.registerPath({
  method: 'get',
  path: '/blog/posts',
  summary: 'List blog posts',
  tags: [tag],
  parameters: [
    { name: 'q', in: 'query', schema: { type: 'string' }, description: 'Search in title, content and excerpt' },
    { name: 'category', in: 'query', schema: { type: 'string' }, description: 'Category slug' },
    { name: 'tag', in: 'query', schema: { type: 'string' }, description: 'Tag slug or comma separated slugs' },
    { name: 'author', in: 'query', schema: { type: 'string' }, description: 'Author ID or username' },
    { name: 'series', in: 'query', schema: { type: 'string' }, description: 'Series slug' },
    { name: 'is_hot', in: 'query', schema: { type: 'string', enum: ['true', 'false'] } },
    { name: 'ordering', in: 'query', schema: { type: 'string' }, description: 'Sort field (prefix with - for desc)' },
    { name: 'published_after', in: 'query', schema: { type: 'string', format: 'date-time' } },
    { name: 'published_before', in: 'query', schema: { type: 'string', format: 'date-time' } },
    { name: 'visibility', in: 'query', schema: { type: 'string', enum: ['public', 'private', 'unlisted'] } },
    { name: 'status', in: 'query', schema: { type: 'string' } },
    { name: 'page', in: 'query', schema: { type: 'integer', default: 1 } },
    { name: 'pageSize', in: 'query', schema: { type: 'integer', default: 10 } },
  ],
  responses: {
    200: {
      description: 'List of blog posts',
      content: { 'application/json': { schema: withApiSuccess(z.array(BlogPostSchema)) } },
    },
  },
});
router.get('/', controller.listPosts);

registry.registerPath({
  method: 'get',
  path: '/blog/posts/{slug}',
  summary: 'Get blog post by slug',
  tags: [tag],
  parameters: [{ name: 'slug', in: 'path', schema: { type: 'string' }, required: true }],
  responses: {
    200: {
      description: 'Blog post details',
      content: { 'application/json': { schema: withApiSuccess(BlogPostSchema) } },
    },
  },
});

registry.registerPath({
  method: 'get',
  path: '/blog/posts/slug/{slug}',
  summary: 'Get blog post by slug (Legacy compatibility)',
  tags: [tag],
  parameters: [{ name: 'slug', in: 'path', schema: { type: 'string' }, required: true }],
  responses: {
    200: {
      description: 'Blog post details',
      content: { 'application/json': { schema: withApiSuccess(BlogPostSchema) } },
    },
  },
});
router.get('/slug/:slug', controller.getPost);
router.get('/:slug', controller.getPost);

registry.registerPath({
  method: 'get',
  path: '/blog/posts/{slug}/similar',
  summary: 'Get similar posts',
  tags: [tag],
  parameters: [{ name: 'slug', in: 'path', schema: { type: 'string' }, required: true }],
  responses: {
    200: {
      description: 'List of similar posts',
      content: { 'application/json': { schema: withApiSuccess(z.array(BlogPostSchema)) } },
    },
  },
});
router.get('/:slug/similar', controller.getSimilarPosts);

registry.registerPath({
  method: 'get',
  path: '/blog/posts/{slug}/same-category',
  summary: 'Get posts in the same category',
  tags: [tag],
  parameters: [{ name: 'slug', in: 'path', schema: { type: 'string' }, required: true }],
  responses: {
    200: {
      description: 'List of posts',
      content: { 'application/json': { schema: withApiSuccess(z.array(BlogPostSchema)) } },
    },
  },
});
router.get('/:slug/same-category', controller.getSameCategoryPosts);

registry.registerPath({
  method: 'get',
  path: '/blog/posts/{slug}/related',
  summary: 'Get related posts',
  tags: [tag],
  parameters: [{ name: 'slug', in: 'path', schema: { type: 'string' }, required: true }],
  responses: {
    200: {
      description: 'List of related posts',
      content: { 'application/json': { schema: withApiSuccess(z.array(BlogPostSchema)) } },
    },
  },
});
router.get('/:slug/related', controller.getRelatedPosts);

// Nested comments
registry.registerPath({
  method: 'get',
  path: '/blog/posts/{slug}/comments',
  summary: 'List comments for a post',
  tags: [tag],
  parameters: [{ name: 'slug', in: 'path', schema: { type: 'string' }, required: true }],
  responses: {
    200: {
      description: 'List of comments',
      content: { 'application/json': { schema: withApiSuccess(z.array(CommentSchema)) } },
    },
  },
});
router.get('/:slug/comments', commentsController.listPostComments);

registry.registerPath({
  method: 'post',
  path: '/blog/posts/{slug}/comments',
  summary: 'Create a comment for a post',
  tags: [tag],
  security: [{ bearerAuth: [] }],
  parameters: [{ name: 'slug', in: 'path', schema: { type: 'string' }, required: true }],
  request: {
    body: { content: { 'application/json': { schema: createCommentSchema.shape.body } } },
  },
  responses: {
    201: {
      description: 'Comment created',
      content: { 'application/json': { schema: withApiSuccess(CommentSchema) } },
    },
  },
});
router.post(
  '/:slug/comments',
  requireAuth(),
  validate(createCommentSchema),
  commentsController.createComment
);

registry.registerPath({
  method: 'post',
  path: '/blog/posts',
  summary: 'Create a blog post (Author/Admin)',
  tags: [tag],
  security: [{ bearerAuth: [] }],
  request: {
    body: { content: { 'application/json': { schema: createPostSchema.shape.body } } },
  },
  responses: {
    201: {
      description: 'Post created',
      content: { 'application/json': { schema: withApiSuccess(BlogPostSchema) } },
    },
  },
});
router.post(
  '/',
  requireAuth(),
  requireRole([UserRole.AUTHOR, UserRole.MODERATOR, UserRole.ADMIN]),
  validate(createPostSchema),
  controller.createPost
);

registry.registerPath({
  method: 'patch',
  path: '/blog/posts/{slug}',
  summary: 'Update a blog post (Author/Admin)',
  tags: [tag],
  security: [{ bearerAuth: [] }],
  parameters: [{ name: 'slug', in: 'path', schema: { type: 'string' }, required: true }],
  request: {
    body: { content: { 'application/json': { schema: updatePostSchema.shape.body } } },
  },
  responses: {
    200: {
      description: 'Post updated',
      content: { 'application/json': { schema: withApiSuccess(BlogPostSchema) } },
    },
  },
});
router.patch(
  '/:slug',
  requireAuth(),
  requireRole([UserRole.AUTHOR, UserRole.MODERATOR, UserRole.ADMIN]),
  validate(updatePostSchema),
  controller.updatePost
);

registry.registerPath({
  method: 'delete',
  path: '/blog/posts/{slug}',
  summary: 'Delete a blog post (Author/Admin)',
  tags: [tag],
  security: [{ bearerAuth: [] }],
  parameters: [{ name: 'slug', in: 'path', schema: { type: 'string' }, required: true }],
  responses: {
    200: {
      description: 'Post deleted',
      content: { 'application/json': { schema: withApiSuccess(z.object({ ok: z.boolean() })) } },
    },
  },
});
router.delete(
  '/:slug',
  requireAuth(),
  requireRole([UserRole.AUTHOR, UserRole.MODERATOR, UserRole.ADMIN]),
  controller.deletePost
);

registry.registerPath({
  method: 'post',
  path: '/blog/posts/{slug}/publish',
  summary: 'Publish a blog post (Author/Admin)',
  tags: [tag],
  security: [{ bearerAuth: [] }],
  parameters: [{ name: 'slug', in: 'path', schema: { type: 'string' }, required: true }],
  responses: {
    200: {
      description: 'Post published',
      content: { 'application/json': { schema: withApiSuccess(BlogPostSchema) } },
    },
  },
});
router.post(
  '/:slug/publish',
  requireAuth(),
  requireRole([UserRole.AUTHOR, UserRole.MODERATOR, UserRole.ADMIN]),
  controller.publishPost
);

export default router;
