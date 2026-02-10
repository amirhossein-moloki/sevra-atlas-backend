import { Router } from 'express';
import { VerificationController } from './verification.controller';
import { requireAuth, requireRole } from '../../shared/middlewares/auth.middleware';
import { validate } from '../../shared/middlewares/validate.middleware';
import { requestVerificationSchema, reviewVerificationSchema } from './verification.validators';
import { UserRole } from '@prisma/client';

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
  requireRole([UserRole.ADMIN, UserRole.MODERATOR]),
  controller.listRequests
);

router.patch(
  '/:id',
  requireAuth(),
  requireRole([UserRole.ADMIN, UserRole.MODERATOR]),
  validate(reviewVerificationSchema),
  controller.reviewRequest
);

export default router;
