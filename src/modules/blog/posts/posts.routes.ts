import { Router } from 'express';
import { PostsController } from './posts.controller';
import { BlogCommentsController } from '../comments/comments.controller';
import { requireAuth } from '../../../shared/middlewares/auth.middleware';
import { validate } from '../../../shared/middlewares/validate.middleware';
import { createPostSchema, updatePostSchema } from './posts.validators';
import { createCommentSchema } from '../comments/comments.validators';
import { registry, z } from '../../../shared/openapi/registry';

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
    { name: 'category', in: 'query', schema: { type: 'string' } },
    { name: 'tag', in: 'query', schema: { type: 'string' } },
    { name: 'author', in: 'query', schema: { type: 'string' } },
    { name: 'status', in: 'query', schema: { type: 'string' } },
    { name: 'page', in: 'query', schema: { type: 'integer' } },
    { name: 'pageSize', in: 'query', schema: { type: 'integer' } },
  ],
  responses: {
    200: {
      description: 'List of blog posts',
      content: { 'application/json': { schema: z.object({ data: z.array(z.any()), meta: z.any() }) } },
    },
  },
});
router.get('/', controller.listPosts);

registry.registerPath({
  method: 'get',
  path: '/blog/posts/{slug}',
  summary: 'Get blog post by slug',
  tags: [tag],
  parameters: [{ name: 'slug', in: 'path', schema: { type: 'string' } }],
  responses: {
    200: {
      description: 'Blog post details',
      content: { 'application/json': { schema: z.any() } },
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
  parameters: [{ name: 'slug', in: 'path', schema: { type: 'string' } }],
  responses: {
    200: {
      description: 'List of similar posts',
      content: { 'application/json': { schema: z.array(z.any()) } },
    },
  },
});
router.get('/:slug/similar', controller.getSimilarPosts);

registry.registerPath({
  method: 'get',
  path: '/blog/posts/{slug}/same-category',
  summary: 'Get posts in the same category',
  tags: [tag],
  parameters: [{ name: 'slug', in: 'path', schema: { type: 'string' } }],
  responses: {
    200: {
      description: 'List of posts',
      content: { 'application/json': { schema: z.array(z.any()) } },
    },
  },
});
router.get('/:slug/same-category', controller.getSameCategoryPosts);

registry.registerPath({
  method: 'get',
  path: '/blog/posts/{slug}/related',
  summary: 'Get related posts',
  tags: [tag],
  parameters: [{ name: 'slug', in: 'path', schema: { type: 'string' } }],
  responses: {
    200: {
      description: 'List of related posts',
      content: { 'application/json': { schema: z.array(z.any()) } },
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
  parameters: [{ name: 'slug', in: 'path', schema: { type: 'string' } }],
  responses: {
    200: {
      description: 'List of comments',
      content: { 'application/json': { schema: z.array(z.any()) } },
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
  parameters: [{ name: 'slug', in: 'path', schema: { type: 'string' } }],
  request: {
    body: { content: { 'application/json': { schema: createCommentSchema.shape.body } } },
  },
  responses: {
    201: {
      description: 'Comment created',
      content: { 'application/json': { schema: z.any() } },
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
  summary: 'Create a blog post',
  tags: [tag],
  security: [{ bearerAuth: [] }],
  request: {
    body: { content: { 'application/json': { schema: createPostSchema.shape.body } } },
  },
  responses: {
    201: {
      description: 'Post created',
      content: { 'application/json': { schema: z.any() } },
    },
  },
});
router.post(
  '/',
  requireAuth(),
  validate(createPostSchema),
  controller.createPost
);

registry.registerPath({
  method: 'patch',
  path: '/blog/posts/{slug}',
  summary: 'Update a blog post',
  tags: [tag],
  security: [{ bearerAuth: [] }],
  parameters: [{ name: 'slug', in: 'path', schema: { type: 'string' } }],
  request: {
    body: { content: { 'application/json': { schema: updatePostSchema.shape.body } } },
  },
  responses: {
    200: {
      description: 'Post updated',
      content: { 'application/json': { schema: z.any() } },
    },
  },
});
router.patch(
  '/:slug',
  requireAuth(),
  validate(updatePostSchema),
  controller.updatePost
);

registry.registerPath({
  method: 'delete',
  path: '/blog/posts/{slug}',
  summary: 'Delete a blog post',
  tags: [tag],
  security: [{ bearerAuth: [] }],
  parameters: [{ name: 'slug', in: 'path', schema: { type: 'string' } }],
  responses: {
    200: {
      description: 'Post deleted',
      content: { 'application/json': { schema: z.object({ ok: z.boolean() }) } },
    },
  },
});
router.delete(
  '/:slug',
  requireAuth(),
  controller.deletePost
);

registry.registerPath({
  method: 'post',
  path: '/blog/posts/{slug}/publish',
  summary: 'Publish a blog post',
  tags: [tag],
  security: [{ bearerAuth: [] }],
  parameters: [{ name: 'slug', in: 'path', schema: { type: 'string' } }],
  responses: {
    200: {
      description: 'Post published',
      content: { 'application/json': { schema: z.any() } },
    },
  },
});
router.post(
  '/:slug/publish',
  requireAuth(),
  controller.publishPost
);

export default router;
