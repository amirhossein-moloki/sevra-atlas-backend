import { Router } from 'express';
import { SubscriptionsController } from './subscriptions.controller';
import { requireAuth, requireRole } from '../../shared/middlewares/auth.middleware';
import { UserRole } from '@prisma/client';
import { registry, withApiSuccess, z } from '../../shared/openapi/registry';
import { PlanSchema, SubscriptionSchema } from '../../shared/openapi/schemas';

const router = Router();
const controller = new SubscriptionsController();

const tag = 'Subscriptions';

// Public routes
registry.registerPath({
  method: 'get',
  path: '/subscriptions/plans',
  summary: 'List available subscription plans',
  tags: [tag],
  parameters: [
    { name: 'entityType', in: 'query', schema: { type: 'string', enum: ['SALON', 'ARTIST'] }, required: false }
  ],
  responses: {
    200: {
      description: 'List of plans',
      content: { 'application/json': { schema: withApiSuccess(z.array(PlanSchema)) } }
    }
  }
});
router.get('/plans', controller.getPlans);

// Admin routes
registry.registerPath({
  method: 'post',
  path: '/subscriptions/assign',
  summary: 'Assign a plan to an entity (Admin)',
  tags: [tag],
  security: [{ bearerAuth: [] }],
  request: {
    body: {
      content: {
        'application/json': {
          schema: z.object({
            targetType: z.enum(['SALON', 'ARTIST']),
            targetId: z.string(),
            planId: z.string(),
            notes: z.string().optional(),
          })
        }
      }
    }
  },
  responses: {
    200: {
      description: 'Plan assigned',
      content: { 'application/json': { schema: withApiSuccess(SubscriptionSchema) } }
    }
  }
});
router.post('/assign', requireAuth(), requireRole([UserRole.ADMIN]), controller.assignPlan);

registry.registerPath({
  method: 'post',
  path: '/subscriptions/suspend',
  summary: 'Suspend a subscription (Admin)',
  tags: [tag],
  security: [{ bearerAuth: [] }],
  request: {
    body: {
      content: {
        'application/json': {
          schema: z.object({
            targetType: z.enum(['SALON', 'ARTIST']),
            targetId: z.string(),
          })
        }
      }
    }
  },
  responses: {
    200: {
      description: 'Subscription suspended',
      content: { 'application/json': { schema: withApiSuccess(SubscriptionSchema) } }
    }
  }
});
router.post('/suspend', requireAuth(), requireRole([UserRole.ADMIN]), controller.suspendSubscription);

registry.registerPath({
  method: 'post',
  path: '/subscriptions/override-score',
  summary: 'Override visibility score (Admin)',
  tags: [tag],
  security: [{ bearerAuth: [] }],
  request: {
    body: {
      content: {
        'application/json': {
          schema: z.object({
            targetType: z.enum(['SALON', 'ARTIST']),
            targetId: z.string(),
            score: z.number(),
          })
        }
      }
    }
  },
  responses: {
    200: {
      description: 'Score updated',
      content: { 'application/json': { schema: withApiSuccess(z.object({ ok: z.boolean() })) } }
    }
  }
});
router.post('/override-score', requireAuth(), requireRole([UserRole.ADMIN]), controller.overrideScore);

registry.registerPath({
  method: 'get',
  path: '/subscriptions/stats',
  summary: 'Get revenue stats (Admin)',
  tags: [tag],
  security: [{ bearerAuth: [] }],
  responses: {
    200: {
      description: 'Revenue stats',
      content: {
        'application/json': {
          schema: withApiSuccess(z.object({
            totalRevenue: z.string(),
            revenueByPlan: z.record(z.number())
          }))
        }
      }
    }
  }
});
router.get('/stats', requireAuth(), requireRole([UserRole.ADMIN]), controller.getStats);

registry.registerPath({
  method: 'get',
  path: '/subscriptions/analytics',
  summary: 'Get subscription analytics (Admin)',
  tags: [tag],
  security: [{ bearerAuth: [] }],
  responses: {
    200: {
      description: 'Analytics data',
      content: {
        'application/json': {
          schema: withApiSuccess(z.object({
            conversionRate: z.number(),
            totalConversions: z.number(),
            totalChurns: z.number(),
            churnRate: z.number(),
            revenueByCity: z.array(z.any())
          }))
        }
      }
    }
  }
});
router.get('/analytics', requireAuth(), requireRole([UserRole.ADMIN]), controller.getAnalytics);

registry.registerPath({
  method: 'get',
  path: '/subscriptions/export-billing',
  summary: 'Export billing history (Admin)',
  tags: [tag],
  security: [{ bearerAuth: [] }],
  responses: {
    200: {
      description: 'Billing history export',
      content: {
        'application/json': {
          schema: withApiSuccess(z.array(z.any()))
        }
      }
    }
  }
});
router.get('/export-billing', requireAuth(), requireRole([UserRole.ADMIN]), controller.exportBilling);

registry.registerPath({
  method: 'post',
  path: '/subscriptions/check-expirations',
  summary: 'Trigger manual expiration check (Admin)',
  tags: [tag],
  security: [{ bearerAuth: [] }],
  responses: {
    200: {
      description: 'Expirations checked',
      content: {
        'application/json': {
          schema: withApiSuccess(z.object({ processedCount: z.number() }))
        }
      }
    }
  }
});
router.post('/check-expirations', requireAuth(), requireRole([UserRole.ADMIN]), controller.runExpirationCheck);

export default router;
