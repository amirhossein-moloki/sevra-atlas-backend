import { Router } from 'express';
import { BlogTaxonomyController } from './taxonomy.controller';
import { requireAuth, requireAdmin } from '../../shared/middlewares/auth.middleware';
import { validate } from '../../shared/middlewares/validate.middleware';
import {
  createCategorySchema,
  updateCategorySchema,
  createTagSchema,
  updateTagSchema,
  createSeriesSchema,
  updateSeriesSchema,
} from './taxonomy.validators';
import { registry, z, withApiSuccess } from '../../shared/openapi/registry';

const router = Router();
const controller = new BlogTaxonomyController();

const tag = 'Blog Taxonomy';

registry.registerPath({
  method: 'get',
  path: '/blog/taxonomy/categories',
  summary: 'List categories',
  tags: [tag],
  responses: {
    200: {
      description: 'List of categories',
      content: { 'application/json': { schema: withApiSuccess(z.array(z.any())) } }
    }
  }
});
router.get('/categories', controller.listCategories);

registry.registerPath({
  method: 'post',
  path: '/blog/taxonomy/categories',
  summary: 'Create category (Admin)',
  tags: [tag],
  security: [{ bearerAuth: [] }],
  request: {
    body: { content: { 'application/json': { schema: createCategorySchema.shape.body } } }
  },
  responses: {
    201: {
      description: 'Category created',
      content: { 'application/json': { schema: withApiSuccess(z.any()) } }
    }
  }
});
router.post(
  '/categories',
  requireAuth(),
  requireAdmin(),
  validate(createCategorySchema),
  controller.createCategory
);

registry.registerPath({
  method: 'get',
  path: '/blog/taxonomy/categories/{id}',
  summary: 'Get category by ID',
  tags: [tag],
  parameters: [{ name: 'id', in: 'path', schema: { type: 'string' }, required: true }],
  responses: {
    200: {
      description: 'Category details',
      content: { 'application/json': { schema: withApiSuccess(z.any()) } }
    }
  }
});
router.get('/categories/:id', controller.getCategory);

registry.registerPath({
  method: 'patch',
  path: '/blog/taxonomy/categories/{id}',
  summary: 'Update category (Admin)',
  tags: [tag],
  security: [{ bearerAuth: [] }],
  parameters: [{ name: 'id', in: 'path', schema: { type: 'string' }, required: true }],
  request: {
    body: { content: { 'application/json': { schema: updateCategorySchema.shape.body } } }
  },
  responses: {
    200: {
      description: 'Category updated',
      content: { 'application/json': { schema: withApiSuccess(z.any()) } }
    }
  }
});
router.patch(
  '/categories/:id',
  requireAuth(),
  requireAdmin(),
  validate(updateCategorySchema),
  controller.updateCategory
);

registry.registerPath({
  method: 'delete',
  path: '/blog/taxonomy/categories/{id}',
  summary: 'Delete category (Admin)',
  tags: [tag],
  security: [{ bearerAuth: [] }],
  parameters: [{ name: 'id', in: 'path', schema: { type: 'string' }, required: true }],
  responses: {
    200: {
      description: 'Category deleted',
      content: { 'application/json': { schema: withApiSuccess(z.object({ ok: z.boolean() })) } }
    }
  }
});
router.delete('/categories/:id', requireAuth(), requireAdmin(), controller.deleteCategory);

registry.registerPath({
  method: 'get',
  path: '/blog/taxonomy/tags',
  summary: 'List tags',
  tags: [tag],
  responses: {
    200: {
      description: 'List of tags',
      content: { 'application/json': { schema: withApiSuccess(z.array(z.any())) } }
    }
  }
});
router.get('/tags', controller.listTags);

registry.registerPath({
  method: 'post',
  path: '/blog/taxonomy/tags',
  summary: 'Create tag (Admin)',
  tags: [tag],
  security: [{ bearerAuth: [] }],
  request: {
    body: { content: { 'application/json': { schema: createTagSchema.shape.body } } }
  },
  responses: {
    201: {
      description: 'Tag created',
      content: { 'application/json': { schema: withApiSuccess(z.any()) } }
    }
  }
});
router.post(
  '/tags',
  requireAuth(),
  requireAdmin(),
  validate(createTagSchema),
  controller.createTag
);

registry.registerPath({
  method: 'get',
  path: '/blog/taxonomy/tags/{id}',
  summary: 'Get tag by ID',
  tags: [tag],
  parameters: [{ name: 'id', in: 'path', schema: { type: 'string' }, required: true }],
  responses: {
    200: {
      description: 'Tag details',
      content: { 'application/json': { schema: withApiSuccess(z.any()) } }
    }
  }
});
router.get('/tags/:id', controller.getTag);

registry.registerPath({
  method: 'patch',
  path: '/blog/taxonomy/tags/{id}',
  summary: 'Update tag (Admin)',
  tags: [tag],
  security: [{ bearerAuth: [] }],
  parameters: [{ name: 'id', in: 'path', schema: { type: 'string' }, required: true }],
  request: {
    body: { content: { 'application/json': { schema: updateTagSchema.shape.body } } }
  },
  responses: {
    200: {
      description: 'Tag updated',
      content: { 'application/json': { schema: withApiSuccess(z.any()) } }
    }
  }
});
router.patch(
  '/tags/:id',
  requireAuth(),
  requireAdmin(),
  validate(updateTagSchema),
  controller.updateTag
);

registry.registerPath({
  method: 'delete',
  path: '/blog/taxonomy/tags/{id}',
  summary: 'Delete tag (Admin)',
  tags: [tag],
  security: [{ bearerAuth: [] }],
  parameters: [{ name: 'id', in: 'path', schema: { type: 'string' }, required: true }],
  responses: {
    200: {
      description: 'Tag deleted',
      content: { 'application/json': { schema: withApiSuccess(z.object({ ok: z.boolean() })) } }
    }
  }
});
router.delete('/tags/:id', requireAuth(), requireAdmin(), controller.deleteTag);

registry.registerPath({
  method: 'get',
  path: '/blog/taxonomy/series',
  summary: 'List series',
  tags: [tag],
  responses: {
    200: {
      description: 'List of series',
      content: { 'application/json': { schema: withApiSuccess(z.array(z.any())) } }
    }
  }
});
router.get('/series', controller.listSeries);

registry.registerPath({
  method: 'post',
  path: '/blog/taxonomy/series',
  summary: 'Create series (Admin)',
  tags: [tag],
  security: [{ bearerAuth: [] }],
  request: {
    body: { content: { 'application/json': { schema: createSeriesSchema.shape.body } } }
  },
  responses: {
    201: {
      description: 'Series created',
      content: { 'application/json': { schema: withApiSuccess(z.any()) } }
    }
  }
});
router.post(
  '/series',
  requireAuth(),
  requireAdmin(),
  validate(createSeriesSchema),
  controller.createSeries
);

registry.registerPath({
  method: 'get',
  path: '/blog/taxonomy/series/{id}',
  summary: 'Get series by ID',
  tags: [tag],
  parameters: [{ name: 'id', in: 'path', schema: { type: 'string' }, required: true }],
  responses: {
    200: {
      description: 'Series details',
      content: { 'application/json': { schema: withApiSuccess(z.any()) } }
    }
  }
});
router.get('/series/:id', controller.getSeries);

registry.registerPath({
  method: 'patch',
  path: '/blog/taxonomy/series/{id}',
  summary: 'Update series (Admin)',
  tags: [tag],
  security: [{ bearerAuth: [] }],
  parameters: [{ name: 'id', in: 'path', schema: { type: 'string' }, required: true }],
  request: {
    body: { content: { 'application/json': { schema: updateSeriesSchema.shape.body } } }
  },
  responses: {
    200: {
      description: 'Series updated',
      content: { 'application/json': { schema: withApiSuccess(z.any()) } }
    }
  }
});
router.patch(
  '/series/:id',
  requireAuth(),
  requireAdmin(),
  validate(updateSeriesSchema),
  controller.updateSeries
);

registry.registerPath({
  method: 'delete',
  path: '/blog/taxonomy/series/{id}',
  summary: 'Delete series (Admin)',
  tags: [tag],
  security: [{ bearerAuth: [] }],
  parameters: [{ name: 'id', in: 'path', schema: { type: 'string' }, required: true }],
  responses: {
    200: {
      description: 'Series deleted',
      content: { 'application/json': { schema: withApiSuccess(z.object({ ok: z.boolean() })) } }
    }
  }
});
router.delete('/series/:id', requireAuth(), requireAdmin(), controller.deleteSeries);

export default router;
