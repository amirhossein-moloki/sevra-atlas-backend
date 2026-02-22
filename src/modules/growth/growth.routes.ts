import { Router } from 'express';
import { GrowthController } from './growth.controller';
import { requireAuth } from '../../shared/middlewares/auth.middleware';
import { rateLimit } from '../../shared/middlewares/rateLimit.middleware';
import { registry, withApiSuccess, z } from '../../shared/openapi/registry';

const router = Router();
const controller = new GrowthController();

const tag = 'Growth';

registry.registerPath({
  method: 'post',
  path: '/growth/invites',
  summary: 'Create an invite code',
  tags: [tag],
  security: [{ bearerAuth: [] }],
  responses: {
    200: {
      description: 'Invite created',
      content: { 'application/json': { schema: withApiSuccess(z.object({ code: z.string() })) } }
    }
  }
});
router.post('/invites', requireAuth(), rateLimit('growth_invite', 5, 86400), controller.createInvite);

registry.registerPath({
  method: 'get',
  path: '/growth/stats',
  summary: 'Get growth stats for user',
  tags: [tag],
  security: [{ bearerAuth: [] }],
  responses: {
    200: {
      description: 'Growth stats',
      content: {
        'application/json': {
          schema: withApiSuccess(z.object({
            count: z.number(),
            referrals: z.array(z.any()),
          }))
        }
      }
    }
  }
});
router.get('/stats', requireAuth(), controller.getMyStats);

export default router;
