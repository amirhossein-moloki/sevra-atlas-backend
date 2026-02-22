import { Router } from 'express';
import { GrowthController } from './growth.controller';
import { requireAuth } from '../../shared/middlewares/auth.middleware';
import { rateLimit } from '../../shared/middlewares/rateLimit.middleware';
import { registry, withApiSuccess, z } from '../../shared/openapi/registry';
import { validate } from '../../shared/middlewares/validate.middleware';
import { leadEventSchema } from './growth.validators';

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
            totalInvites: z.number(),
            acceptedInvites: z.number(),
          }))
        }
      }
    }
  }
});
router.get('/stats', requireAuth(), controller.getMyStats);

registry.registerPath({
  method: 'post',
  path: '/growth/lead-event',
  summary: 'Track a lead event (e.g. blog to salon)',
  tags: [tag],
  request: {
    body: {
      content: {
        'application/json': {
          schema: z.object({
            eventType: z.enum(['blog_to_salon', 'blog_to_call']),
            sourcePostId: z.number().optional(),
            targetSalonId: z.number().optional(),
          })
        }
      }
    }
  },
  responses: {
    200: {
      description: 'Event tracked',
      content: { 'application/json': { schema: withApiSuccess(z.object({ id: z.string() })) } }
    }
  }
});
router.post('/lead-event', validate(leadEventSchema), controller.trackLeadEvent);

export default router;
