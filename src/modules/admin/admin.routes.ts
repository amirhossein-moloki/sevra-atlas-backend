import { Router } from 'express';
import { AdminController } from './admin.controller';
import { requireAuth, requireAdmin } from '../../shared/middlewares/auth.middleware';
import { validate } from '../../shared/middlewares/validate.middleware';
import { statsQuerySchema } from './admin.validators';
import { registry, z, withApiSuccess } from '../../shared/openapi/registry';

const router = Router();
const controller = new AdminController();

const tag = 'Admin';

registry.registerPath({
  method: 'get',
  path: '/admin/dashboard',
  summary: 'Get admin dashboard summary',
  tags: [tag],
  security: [{ bearerAuth: [] }],
  responses: {
    200: {
      description: 'Dashboard summary data',
      content: {
        'application/json': {
          schema: withApiSuccess(z.object({
            counts: z.object({
              users: z.object({ total: z.number(), growth: z.number() }),
              salons: z.object({ total: z.number(), growth: z.number() }),
              artists: z.object({ total: z.number(), growth: z.number() }),
              reviews: z.object({ total: z.number(), growth: z.number() }),
              reportsOpen: z.number(),
              verificationPending: z.number(),
            }),
            distributions: z.object({
              salonStatus: z.array(z.object({ status: z.string(), count: z.number() })),
              reviewRating: z.array(z.object({ rating: z.number(), count: z.number() })),
              postStatus: z.array(z.object({ status: z.string(), count: z.number() })),
            }),
            topCities: z.array(z.object({ name: z.string(), count: z.number() })),
          })),
        },
      },
    },
  },
});

router.get('/dashboard', requireAuth(), requireAdmin(), controller.getDashboard);

registry.registerPath({
  method: 'get',
  path: '/admin/stats',
  summary: 'Get time-series stats',
  tags: [tag],
  security: [{ bearerAuth: [] }],
  parameters: [
    { name: 'from', in: 'query', schema: { type: 'string', format: 'date-time' }, required: true },
    { name: 'to', in: 'query', schema: { type: 'string', format: 'date-time' }, required: true },
  ],
  responses: {
    200: {
      description: 'Time-series stats',
      content: {
        'application/json': {
          schema: withApiSuccess(z.object({
            series: z.object({
              newUsers: z.array(z.object({ date: z.string(), count: z.number() })),
              newSalons: z.array(z.object({ date: z.string(), count: z.number() })),
              newArtists: z.array(z.object({ date: z.string(), count: z.number() })),
              newReviews: z.array(z.object({ date: z.string(), count: z.number() })),
              newPosts: z.array(z.object({ date: z.string(), count: z.number() })),
            }),
          })),
        },
      },
    },
  },
});

router.get('/stats', requireAuth(), requireAdmin(), validate(statsQuerySchema), controller.getStats);

export default router;
