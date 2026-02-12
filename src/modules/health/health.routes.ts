import { Router } from 'express';
import { HealthController } from './health.controller';
import { registry, z, withApiSuccess } from '../../shared/openapi/registry';

const router = Router();
const healthController = new HealthController();

registry.registerPath({
  method: 'get',
  path: '/health',
  summary: 'Check system health',
  tags: ['Health'],
  responses: {
    200: {
      description: 'System is healthy',
      content: {
        'application/json': {
          schema: withApiSuccess(z.object({
            status: z.string(),
            timestamp: z.string(),
            environment: z.string(),
            services: z.object({
              database: z.string(),
              redis_cache: z.string(),
              redis_queue: z.string(),
            }),
          })),
        },
      },
    },
    503: {
      description: 'System is unhealthy',
    },
  },
});
router.get('/', healthController.check);

registry.registerPath({
  method: 'get',
  path: '/health/ready',
  summary: 'Check if system is ready to handle requests',
  tags: ['Health'],
  responses: {
    200: {
      description: 'System is ready',
    },
    503: {
      description: 'System is not ready',
    },
  },
});
router.get('/ready', healthController.ready);

export default router;
