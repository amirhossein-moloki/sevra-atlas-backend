import { Router } from 'express';
import { BlogCommentsController } from './comments.controller';
import { requireAuth, requireRole } from '../../../shared/middlewares/auth.middleware';
import { UserRole } from '@prisma/client';
import { validate } from '../../../shared/middlewares/validate.middleware';
import { updateCommentStatusSchema } from './comments.validators';

const router = Router();
const controller = new BlogCommentsController();

router.get('/', controller.listGlobalComments);

router.patch(
  '/:id/status',
  requireAuth(),
  requireRole([UserRole.ADMIN, UserRole.MODERATOR]),
  validate(updateCommentStatusSchema),
  controller.updateCommentStatus
);

router.delete(
  '/:id',
  requireAuth(),
  requireRole([UserRole.ADMIN]),
  controller.deleteComment
);

export default router;
