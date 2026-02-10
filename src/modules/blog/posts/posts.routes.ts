import { Router } from 'express';
import { PostsController } from './posts.controller';
import { authMiddleware, requireRole } from '../../../shared/middlewares/auth.middleware';
import { UserRole } from '@prisma/client';
import { validate } from '../../../shared/middlewares/validate.middleware';
import { createPostSchema } from './posts.validators';

const router = Router();
const controller = new PostsController();

router.get('/', controller.getPosts);
router.get('/:slug', controller.getPost);

router.post(
  '/',
  authMiddleware,
  requireRole([UserRole.AUTHOR, UserRole.ADMIN]),
  validate(createPostSchema),
  controller.createPost
);

router.patch(
  '/:id',
  authMiddleware,
  requireRole([UserRole.AUTHOR, UserRole.ADMIN]),
  controller.updatePost
);

router.post(
  '/:id/publish',
  authMiddleware,
  requireRole([UserRole.AUTHOR, UserRole.ADMIN]),
  controller.publishPost
);

export default router;
