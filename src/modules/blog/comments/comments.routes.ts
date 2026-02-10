import { Router } from 'express';
import { BlogCommentsController } from './comments.controller';
import { requireAuth, requireRole } from '../../../shared/middlewares/auth.middleware';
import { UserRole } from '@prisma/client';

const router = Router();
const controller = new BlogCommentsController();

router.get('/', controller.listGlobalComments);

router.patch(
  '/:id/status',
  requireAuth(),
  requireRole([UserRole.ADMIN, UserRole.MODERATOR]),
  controller.updateCommentStatus
);

router.delete(
  '/:id',
  requireAuth(),
  requireRole([UserRole.ADMIN]),
  controller.deleteComment
);

export default router;
