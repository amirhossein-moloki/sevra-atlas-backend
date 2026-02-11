import { Router } from 'express';
import { FollowsController } from './follows.controller';
import { requireAuth } from '../../shared/middlewares/auth.middleware';
import { registry, z, withApiSuccess } from '../../shared/openapi/registry';
import { FollowSchema } from '../../shared/openapi/schemas';

const router = Router();
const controller = new FollowsController();

const tag = 'Follows';

registry.registerPath({
  method: 'post',
  path: '/follow',
  summary: 'Follow an entity',
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
      description: 'Followed successfully',
      content: { 'application/json': { schema: withApiSuccess(FollowSchema) } }
    }
  }
});
router.post('/', requireAuth(), controller.follow);

registry.registerPath({
  method: 'delete',
  path: '/follow',
  summary: 'Unfollow an entity',
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
      description: 'Unfollowed successfully',
      content: { 'application/json': { schema: withApiSuccess(z.object({ ok: z.boolean() })) } }
    }
  }
});
router.delete('/', requireAuth(), controller.unfollow);

registry.registerPath({
  method: 'get',
  path: '/follow/me',
  summary: 'Get my follows',
  tags: [tag],
  security: [{ bearerAuth: [] }],
  responses: {
    200: {
      description: 'List of follows',
      content: { 'application/json': { schema: withApiSuccess(z.array(FollowSchema)) } }
    }
  }
});
router.get('/me', requireAuth(), controller.getMyFollows);

export default router;
