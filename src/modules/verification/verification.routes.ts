import { Router } from 'express';
import { VerificationController } from './verification.controller';
import { requireAuth, requireRole, requireStaff } from '../../shared/middlewares/auth.middleware';
import { validate } from '../../shared/middlewares/validate.middleware';
import { requestVerificationSchema, reviewVerificationSchema } from './verification.validators';

const router = Router();
const controller = new VerificationController();

router.post(
  '/request',
  requireAuth(),
  validate(requestVerificationSchema),
  controller.requestVerification
);

router.get(
  '/requests',
  requireAuth(),
  requireStaff(),
  controller.listRequests
);

router.patch(
  '/:id',
  requireAuth(),
  requireStaff(),
  validate(reviewVerificationSchema),
  controller.reviewRequest
);

export default router;
