import { Router } from 'express';
import { ArtistsController } from './artists.controller';
import { requireAuth, requireAdmin } from '../../shared/middlewares/auth.middleware';
import { registry, z, withApiSuccess } from '../../shared/openapi/registry';
import { SpecialtySchema } from '../../shared/openapi/schemas';

const router = Router();
const controller = new ArtistsController();

const tag = 'Specialties';

registry.registerPath({
  method: 'get',
  path: '/specialties',
  summary: 'List all specialties',
  tags: [tag],
  responses: {
    200: {
      description: 'List of specialties',
      content: { 'application/json': { schema: withApiSuccess(z.array(SpecialtySchema)) } }
    }
  }
});
router.get('/', controller.listSpecialties);

registry.registerPath({
  method: 'post',
  path: '/specialties',
  summary: 'Create a specialty (Admin)',
  tags: [tag],
  security: [{ bearerAuth: [] }],
  request: {
    body: {
      content: { 'application/json': { schema: z.object({ name: z.string(), slug: z.string().optional() }) } }
    }
  },
  responses: {
    201: {
      description: 'Specialty created',
      content: { 'application/json': { schema: withApiSuccess(SpecialtySchema) } }
    }
  }
});
router.post(
  '/',
  requireAuth(),
  requireAdmin(),
  controller.createSpecialty
);

registry.registerPath({
  method: 'patch',
  path: '/specialties/{id}',
  summary: 'Update a specialty (Admin)',
  tags: [tag],
  security: [{ bearerAuth: [] }],
  parameters: [{ name: 'id', in: 'path', schema: { type: 'string' }, required: true }],
  request: {
    body: {
      content: { 'application/json': { schema: z.object({ name: z.string().optional(), slug: z.string().optional() }) } }
    }
  },
  responses: {
    200: {
      description: 'Specialty updated',
      content: { 'application/json': { schema: withApiSuccess(SpecialtySchema) } }
    }
  }
});
router.patch(
  '/:id',
  requireAuth(),
  requireAdmin(),
  controller.updateSpecialty
);

registry.registerPath({
  method: 'delete',
  path: '/specialties/{id}',
  summary: 'Delete a specialty (Admin)',
  tags: [tag],
  security: [{ bearerAuth: [] }],
  parameters: [{ name: 'id', in: 'path', schema: { type: 'string' }, required: true }],
  responses: {
    200: {
      description: 'Specialty deleted',
      content: { 'application/json': { schema: withApiSuccess(z.object({ ok: z.boolean() })) } }
    }
  }
});
router.delete(
  '/:id',
  requireAuth(),
  requireAdmin(),
  controller.deleteSpecialty
);

export default router;
