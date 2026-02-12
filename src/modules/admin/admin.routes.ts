import { Router } from 'express';
import { AdminController } from './admin.controller';
import { AdminTaxonomyController } from './taxonomy.controller';
import { requireAuth, requireAdmin } from '../../shared/middlewares/auth.middleware';
import { validate } from '../../shared/middlewares/validate.middleware';
import { statsQuerySchema } from './admin.validators';
import { registry, z, withApiSuccess } from '../../shared/openapi/registry';

const router = Router();
const controller = new AdminController();
const taxonomyController = new AdminTaxonomyController();

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

// Taxonomy management
registry.registerPath({
  method: 'post',
  path: '/admin/taxonomy/blog/categories/reorder',
  summary: 'Reorder blog categories (Admin)',
  tags: [tag],
  security: [{ bearerAuth: [] }],
  request: {
    body: {
      content: {
        'application/json': {
          schema: z.object({
            items: z.array(z.object({ id: z.string(), order: z.number() })),
          }),
        },
      },
    },
  },
  responses: {
    200: {
      description: 'Categories reordered',
      content: { 'application/json': { schema: withApiSuccess(z.object({ ok: z.boolean() })) } },
    },
  },
});
router.post('/taxonomy/blog/categories/reorder', requireAuth(), requireAdmin(), taxonomyController.reorderBlogCategories);

registry.registerPath({
  method: 'post',
  path: '/admin/taxonomy/services/categories/reorder',
  summary: 'Reorder service categories (Admin)',
  tags: [tag],
  security: [{ bearerAuth: [] }],
  request: {
    body: {
      content: {
        'application/json': {
          schema: z.object({
            items: z.array(z.object({ id: z.string(), order: z.number() })),
          }),
        },
      },
    },
  },
  responses: {
    200: {
      description: 'Categories reordered',
      content: { 'application/json': { schema: withApiSuccess(z.object({ ok: z.boolean() })) } },
    },
  },
});
router.post('/taxonomy/services/categories/reorder', requireAuth(), requireAdmin(), taxonomyController.reorderServiceCategories);

registry.registerPath({
  method: 'post',
  path: '/admin/taxonomy/artists/specialties/reorder',
  summary: 'Reorder specialties (Admin)',
  tags: [tag],
  security: [{ bearerAuth: [] }],
  request: {
    body: {
      content: {
        'application/json': {
          schema: z.object({
            items: z.array(z.object({ id: z.string(), order: z.number() })),
          }),
        },
      },
    },
  },
  responses: {
    200: {
      description: 'Specialties reordered',
      content: { 'application/json': { schema: withApiSuccess(z.object({ ok: z.boolean() })) } },
    },
  },
});
router.post('/taxonomy/artists/specialties/reorder', requireAuth(), requireAdmin(), taxonomyController.reorderSpecialties);

// Entity management
registry.registerPath({
  method: 'patch',
  path: '/admin/salons/{id}/status',
  summary: 'Update salon status (Admin)',
  tags: [tag],
  security: [{ bearerAuth: [] }],
  parameters: [{ name: 'id', in: 'path', schema: { type: 'string' }, required: true }],
  request: {
    body: {
      content: {
        'application/json': {
          schema: z.object({ status: z.string() }),
        },
      },
    },
  },
  responses: {
    200: {
      description: 'Status updated',
      content: { 'application/json': { schema: withApiSuccess(z.object({ ok: z.boolean() })) } },
    },
  },
});
router.patch('/salons/:id/status', requireAuth(), requireAdmin(), controller.updateSalonStatus);

registry.registerPath({
  method: 'patch',
  path: '/admin/artists/{id}/status',
  summary: 'Update artist status (Admin)',
  tags: [tag],
  security: [{ bearerAuth: [] }],
  parameters: [{ name: 'id', in: 'path', schema: { type: 'string' }, required: true }],
  request: {
    body: {
      content: {
        'application/json': {
          schema: z.object({ status: z.string() }),
        },
      },
    },
  },
  responses: {
    200: {
      description: 'Status updated',
      content: { 'application/json': { schema: withApiSuccess(z.object({ ok: z.boolean() })) } },
    },
  },
});
router.patch('/artists/:id/status', requireAuth(), requireAdmin(), controller.updateArtistStatus);

registry.registerPath({
  method: 'get',
  path: '/admin/queues/health',
  summary: 'Check all background queues health (Admin)',
  tags: [tag],
  security: [{ bearerAuth: [] }],
  responses: {
    200: {
      description: 'Queues health data',
      content: { 'application/json': { schema: withApiSuccess(z.object({})) } },
    },
  },
});
router.get('/queues/health', requireAuth(), requireAdmin(), controller.getQueuesHealth);

registry.registerPath({
  method: 'get',
  path: '/admin/jobs/{queue}/{id}',
  summary: 'Check background job status (Admin)',
  tags: [tag],
  security: [{ bearerAuth: [] }],
  parameters: [
    { name: 'queue', in: 'path', schema: { type: 'string' }, required: true },
    { name: 'id', in: 'path', schema: { type: 'string' }, required: true },
  ],
  responses: {
    200: {
      description: 'Job status',
      content: { 'application/json': { schema: withApiSuccess(z.object({
        id: z.string(),
        name: z.string(),
        status: z.string(),
        progress: z.any(),
        failedReason: z.string().optional(),
        timestamp: z.number(),
        finishedOn: z.number().optional(),
        data: z.any(),
        returnValue: z.any(),
      })) } },
    },
  },
});
router.get('/jobs/:queue/:id', requireAuth(), requireAdmin(), controller.getJobStatus);

export default router;
