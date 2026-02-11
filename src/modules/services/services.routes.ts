import { Router } from 'express';
import { ServicesController } from './services.controller';
import { requireAuth, requireAdmin } from '../../shared/middlewares/auth.middleware';
import { validate } from '../../shared/middlewares/validate.middleware';
import { categorySchema, serviceSchema, createCategorySchema, createServiceSchema, updateServiceSchema } from './services.validators';
import { registry, z } from '../../shared/openapi/registry';

const router = Router();
const controller = new ServicesController();

const tag = 'Services';

registry.registerPath({
  method: 'get',
  path: '/services',
  summary: 'List all service categories and their services',
  tags: [tag],
  responses: {
    200: {
      description: 'List of service categories',
      content: { 'application/json': { schema: z.array(categorySchema.extend({ services: z.array(serviceSchema) })) } },
    },
  },
});
router.get('/', controller.listCategories);

registry.registerPath({
  method: 'get',
  path: '/services/{slug}',
  summary: 'Get service details',
  tags: [tag],
  parameters: [{ name: 'slug', in: 'path', schema: { type: 'string' } }],
  responses: {
    200: {
      description: 'Service details',
      content: { 'application/json': { schema: serviceSchema } },
    },
  },
});
router.get('/:slug', controller.getService);

registry.registerPath({
  method: 'post',
  path: '/services/categories',
  summary: 'Create a service category (Admin)',
  tags: [tag],
  security: [{ bearerAuth: [] }],
  request: {
    body: {
      content: { 'application/json': { schema: createCategorySchema.shape.body } },
    },
  },
  responses: {
    201: {
      description: 'Category created',
      content: { 'application/json': { schema: categorySchema } },
    },
  },
});
router.post(
  '/categories',
  requireAuth(),
  requireAdmin(),
  validate(createCategorySchema),
  controller.createCategory
);

registry.registerPath({
  method: 'post',
  path: '/services',
  summary: 'Create a service (Admin)',
  tags: [tag],
  security: [{ bearerAuth: [] }],
  request: {
    body: {
      content: { 'application/json': { schema: createServiceSchema.shape.body } },
    },
  },
  responses: {
    201: {
      description: 'Service created',
      content: { 'application/json': { schema: serviceSchema } },
    },
  },
});
router.post(
  '/',
  requireAuth(),
  requireAdmin(),
  validate(createServiceSchema),
  controller.createService
);

registry.registerPath({
  method: 'patch',
  path: '/services/{id}',
  summary: 'Update a service (Admin)',
  tags: [tag],
  security: [{ bearerAuth: [] }],
  parameters: [{ name: 'id', in: 'path', schema: { type: 'string' } }],
  request: {
    body: {
      content: { 'application/json': { schema: updateServiceSchema.shape.body } },
    },
  },
  responses: {
    200: {
      description: 'Service updated',
      content: { 'application/json': { schema: serviceSchema } },
    },
  },
});
router.patch(
  '/:id',
  requireAuth(),
  requireAdmin(),
  validate(updateServiceSchema),
  controller.updateService
);

registry.registerPath({
  method: 'delete',
  path: '/services/{id}',
  summary: 'Delete a service (Admin)',
  tags: [tag],
  security: [{ bearerAuth: [] }],
  parameters: [{ name: 'id', in: 'path', schema: { type: 'string' } }],
  responses: {
    200: {
      description: 'Service deleted',
      content: { 'application/json': { schema: z.object({ ok: z.boolean() }) } },
    },
  },
});
router.delete(
  '/:id',
  requireAuth(),
  requireAdmin(),
  controller.deleteService
);

export default router;
