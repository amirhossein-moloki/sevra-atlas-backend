import { Router } from 'express';
import { BlogCommentsController } from './comments.controller';
import { requireAuth, requireStaff, requireAdmin } from '../../../shared/middlewares/auth.middleware';
import { validate } from '../../../shared/middlewares/validate.middleware';
import { updateCommentStatusSchema } from './comments.validators';

const router = Router();
const controller = new BlogCommentsController();

router.get('/', controller.listGlobalComments);

router.patch(
  '/:id/status',
  requireAuth(),
  requireStaff(),
  validate(updateCommentStatusSchema),
  controller.updateCommentStatus
);

router.delete(
  '/:id',
  requireAuth(),
  requireAdmin(),
  controller.deleteComment
);

export default router;
