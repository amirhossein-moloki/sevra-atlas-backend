import { Router } from 'express';
import { VerificationController } from './verification.controller';
import { requireAuth, requireRole, requireStaff } from '../../shared/middlewares/auth.middleware';
import { validate } from '../../shared/middlewares/validate.middleware';
import { requestVerificationSchema, reviewVerificationSchema } from './verification.validators';
import { registry, z, withApiSuccess } from '../../shared/openapi/registry';
import { VerificationRequestSchema } from '../../shared/openapi/schemas';

const router = Router();
const controller = new VerificationController();

const tag = 'Verification';

registry.registerPath({
  method: 'post',
  path: '/verification/request',
  summary: 'Request verification',
  tags: [tag],
  security: [{ bearerAuth: [] }],
  request: {
    body: { content: { 'application/json': { schema: requestVerificationSchema.shape.body } } }
  },
  responses: {
    201: {
      description: 'Request submitted',
      content: { 'application/json': { schema: withApiSuccess(VerificationRequestSchema) } }
    }
  }
});
router.post(
  '/request',
  requireAuth(),
  validate(requestVerificationSchema),
  controller.requestVerification
);

registry.registerPath({
  method: 'get',
  path: '/verification/requests',
  summary: 'List verification requests (Staff)',
  tags: [tag],
  security: [{ bearerAuth: [] }],
  responses: {
    200: {
      description: 'List of requests',
      content: { 'application/json': { schema: withApiSuccess(z.array(VerificationRequestSchema)) } }
    }
  }
});
router.get(
  '/requests',
  requireAuth(),
  requireStaff(),
  controller.listRequests
);

registry.registerPath({
  method: 'patch',
  path: '/verification/{id}',
  summary: 'Review verification request (Staff)',
  tags: [tag],
  security: [{ bearerAuth: [] }],
  parameters: [{ name: 'id', in: 'path', schema: { type: 'string' }, required: true }],
  request: {
    body: { content: { 'application/json': { schema: reviewVerificationSchema.shape.body } } }
  },
  responses: {
    200: {
      description: 'Request reviewed',
      content: { 'application/json': { schema: withApiSuccess(VerificationRequestSchema) } }
    }
  }
});
router.patch(
  '/:id',
  requireAuth(),
  requireStaff(),
  validate(reviewVerificationSchema),
  controller.reviewRequest
);

export default router;
