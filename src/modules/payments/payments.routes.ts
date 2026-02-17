import { Router } from 'express';
import { PaymentsController } from './payments.controller';
import { authMiddleware } from '../../shared/middlewares/auth.middleware';
import { validate } from '../../shared/middlewares/validate.middleware';
import { rateLimit } from '../../shared/middlewares/rateLimit.middleware';
import { initZibalSchema, zibalCallbackSchema } from './payments.validators';

const router = Router();
const controller = new PaymentsController();

/**
 * @openapi
 * /api/payments/zibal/init:
 *   post:
 *     summary: Initiate a Zibal payment
 *     tags: [Payments]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [amount, planId]
 *             properties:
 *               amount:
 *                 type: integer
 *               planId:
 *                 type: string
 *               salonId:
 *                 type: string
 *               artistId:
 *                 type: string
 *               description:
 *                 type: string
 *               idempotencyKey:
 *                 type: string
 *               mobile:
 *                 type: string
 */
router.post(
  '/zibal/init',
  authMiddleware,
  rateLimit('payment_init', 5, 60, (req) => req.user?.id.toString() || req.ip || 'anonymous'),
  validate(initZibalSchema),
  controller.initZibal
);

/**
 * @openapi
 * /api/payments/zibal/callback:
 *   get:
 *     summary: Zibal payment callback
 *     tags: [Payments]
 *     parameters:
 *       - in: query
 *         name: trackId
 *         required: true
 *         schema: { type: string }
 *       - in: query
 *         name: success
 *         required: true
 *         schema: { type: string }
 *       - in: query
 *         name: status
 *         required: true
 *         schema: { type: string }
 */
router.get('/zibal/callback', validate(zibalCallbackSchema), controller.zibalCallback);

/**
 * @openapi
 * /api/payments/{id}:
 *   get:
 *     summary: Get payment details
 *     tags: [Payments]
 *     security:
 *       - bearerAuth: []
 */
router.get('/:id', authMiddleware, controller.getPaymentStatus);

export default router;
