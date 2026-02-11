import { Router } from 'express';
import { BlogAuthorsController } from './authors.controller';
import { requireAuth, requireAdmin } from '../../../shared/middlewares/auth.middleware';
import { validate } from '../../../shared/middlewares/validate.middleware';
import { createAuthorSchema, updateAuthorSchema } from './authors.validators';
import { registry, z, withApiSuccess } from '../../../shared/openapi/registry';
import { AuthorSchema } from '../../../shared/openapi/schemas';

const router = Router();
const controller = new BlogAuthorsController();

const tag = 'Blog Authors';

registry.registerPath({
  method: 'get',
  path: '/blog/authors',
  summary: 'List authors',
  tags: [tag],
  responses: {
    200: {
      description: 'List of authors',
      content: { 'application/json': { schema: withApiSuccess(z.array(AuthorSchema)) } }
    }
  }
});
router.get('/', controller.listAuthors);

registry.registerPath({
  method: 'get',
  path: '/blog/authors/{id}',
  summary: 'Get author by ID',
  tags: [tag],
  parameters: [{ name: 'id', in: 'path', schema: { type: 'string' }, required: true }],
  responses: {
    200: {
      description: 'Author details',
      content: { 'application/json': { schema: withApiSuccess(AuthorSchema) } }
    }
  }
});
router.get('/:id', controller.getAuthor);

registry.registerPath({
  method: 'post',
  path: '/blog/authors',
  summary: 'Create author (Admin)',
  tags: [tag],
  security: [{ bearerAuth: [] }],
  request: {
    body: { content: { 'application/json': { schema: createAuthorSchema.shape.body } } }
  },
  responses: {
    201: {
      description: 'Author created',
      content: { 'application/json': { schema: withApiSuccess(AuthorSchema) } }
    }
  }
});
router.post(
  '/',
  requireAuth(),
  requireAdmin(),
  validate(createAuthorSchema),
  controller.createAuthor
);

registry.registerPath({
  method: 'patch',
  path: '/blog/authors/{id}',
  summary: 'Update author (Admin)',
  tags: [tag],
  security: [{ bearerAuth: [] }],
  parameters: [{ name: 'id', in: 'path', schema: { type: 'string' }, required: true }],
  request: {
    body: { content: { 'application/json': { schema: updateAuthorSchema.shape.body } } }
  },
  responses: {
    200: {
      description: 'Author updated',
      content: { 'application/json': { schema: withApiSuccess(AuthorSchema) } }
    }
  }
});
router.patch(
  '/:id',
  requireAuth(),
  requireAdmin(),
  validate(updateAuthorSchema),
  controller.updateAuthor
);

registry.registerPath({
  method: 'delete',
  path: '/blog/authors/{id}',
  summary: 'Delete author (Admin)',
  tags: [tag],
  security: [{ bearerAuth: [] }],
  parameters: [{ name: 'id', in: 'path', schema: { type: 'string' }, required: true }],
  responses: {
    200: {
      description: 'Author deleted',
      content: { 'application/json': { schema: withApiSuccess(z.object({ ok: z.boolean() })) } }
    }
  }
});
router.delete(
  '/:id',
  requireAuth(),
  requireAdmin(),
  controller.deleteAuthor
);

export default router;
