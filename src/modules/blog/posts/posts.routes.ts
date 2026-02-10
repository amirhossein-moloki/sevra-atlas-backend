import { Router } from 'express';
import { PostsController } from './posts.controller';
import { BlogCommentsController } from '../comments/comments.controller';
import { requireAuth } from '../../../shared/middlewares/auth.middleware';
import { validate } from '../../../shared/middlewares/validate.middleware';
import { createPostSchema, updatePostSchema } from './posts.validators';

const router = Router();
const controller = new PostsController();
const commentsController = new BlogCommentsController();

router.get('/', controller.listPosts);
router.get('/slug/:slug', controller.getPost);
router.get('/:slug', controller.getPost);
router.get('/:slug/similar', controller.getSimilarPosts);
router.get('/:slug/same-category', controller.getSameCategoryPosts);
router.get('/:slug/related', controller.getRelatedPosts);

// Nested comments
router.get('/:slug/comments', commentsController.listPostComments);
router.post('/:slug/comments', requireAuth(), commentsController.createComment);

router.post(
  '/',
  requireAuth(),
  validate(createPostSchema),
  controller.createPost
);

router.patch(
  '/:slug',
  requireAuth(),
  validate(updatePostSchema),
  controller.updatePost
);

router.delete(
  '/:slug',
  requireAuth(),
  controller.deletePost
);

router.post(
  '/:slug/publish',
  requireAuth(),
  controller.publishPost
);

export default router;
