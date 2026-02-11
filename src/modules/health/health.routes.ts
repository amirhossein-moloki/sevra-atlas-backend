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
            database: z.string(),
            redis: z.string(),
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

export default router;
