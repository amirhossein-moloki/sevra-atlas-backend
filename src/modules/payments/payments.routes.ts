import { Router } from 'express';
import { PaymentsController } from './payments.controller';
import { authMiddleware } from '../../shared/middlewares/auth.middleware';
import { validate } from '../../shared/middlewares/validate.middleware';
import { rateLimit } from '../../shared/middlewares/rateLimit.middleware';
import { initZibalSchema, zibalCallbackSchema } from './payments.validators';
import { registry, withApiSuccess, z } from '../../shared/openapi/registry';
import { PaymentSchema } from '../../shared/openapi/schemas';

const router = Router();
const controller = new PaymentsController();

const tag = 'Payments';

registry.registerPath({
  method: 'post',
  path: '/payments/zibal/init',
  summary: 'Initiate a Zibal payment',
  tags: [tag],
  security: [{ bearerAuth: [] }],
  request: {
    body: { content: { 'application/json': { schema: initZibalSchema.shape.body } } }
  },
  responses: {
    200: {
      description: 'Payment initiated',
      content: { 'application/json': { schema: withApiSuccess(z.object({ trackId: z.string(), payUrl: z.string() })) } }
    }
  }
});
router.post(
  '/zibal/init',
  authMiddleware,
  rateLimit('payment_init', 5, 60, (req) => req.user?.id.toString() || req.ip || 'anonymous'),
  validate(initZibalSchema),
  controller.initZibal
);

registry.registerPath({
  method: 'get',
  path: '/payments/zibal/callback',
  summary: 'Zibal payment callback',
  tags: [tag],
  parameters: [
    { name: 'trackId', in: 'query', schema: { type: 'string' }, required: true },
    { name: 'success', in: 'query', schema: { type: 'string' }, required: true },
    { name: 'status', in: 'query', schema: { type: 'string' }, required: true },
  ],
  responses: {
    200: {
      description: 'Payment processed',
      content: { 'application/json': { schema: withApiSuccess(z.object({ ok: z.boolean() })) } }
    }
  }
});
router.get('/zibal/callback', validate(zibalCallbackSchema), controller.zibalCallback);

registry.registerPath({
  method: 'get',
  path: '/payments/{id}',
  summary: 'Get payment details',
  tags: [tag],
  security: [{ bearerAuth: [] }],
  parameters: [{ name: 'id', in: 'path', schema: { type: 'string' }, required: true }],
  responses: {
    200: {
      description: 'Payment details',
      content: { 'application/json': { schema: withApiSuccess(PaymentSchema) } }
    }
  }
});
router.get('/:id', authMiddleware, controller.getPaymentStatus);

export default router;
