import { Router } from 'express';
import { SavesController } from './saves.controller';
import { requireAuth } from '../../shared/middlewares/auth.middleware';
import { registry, z, withApiSuccess } from '../../shared/openapi/registry';

const router = Router();
const controller = new SavesController();

const tag = 'Saves';

registry.registerPath({
  method: 'post',
  path: '/save',
  summary: 'Save an entity',
  tags: [tag],
  security: [{ bearerAuth: [] }],
  request: {
    body: {
      content: {
        'application/json': {
          schema: z.object({ targetId: z.string(), targetType: z.string() })
        }
      }
    }
  },
  responses: {
    200: {
      description: 'Saved successfully',
      content: { 'application/json': { schema: withApiSuccess(z.any()) } }
    }
  }
});
router.post('/', requireAuth(), controller.save);

registry.registerPath({
  method: 'delete',
  path: '/save',
  summary: 'Unsave an entity',
  tags: [tag],
  security: [{ bearerAuth: [] }],
  request: {
    body: {
      content: {
        'application/json': {
          schema: z.object({ targetId: z.string(), targetType: z.string() })
        }
      }
    }
  },
  responses: {
    200: {
      description: 'Unsaved successfully',
      content: { 'application/json': { schema: withApiSuccess(z.any()) } }
    }
  }
});
router.delete('/', requireAuth(), controller.unsave);

registry.registerPath({
  method: 'get',
  path: '/save/me',
  summary: 'Get my saved items',
  tags: [tag],
  security: [{ bearerAuth: [] }],
  responses: {
    200: {
      description: 'List of saved items',
      content: { 'application/json': { schema: withApiSuccess(z.array(z.any())) } }
    }
  }
});
router.get('/me', requireAuth(), controller.getMySaves);

export default router;
