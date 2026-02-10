import { Router } from 'express';
import { ReviewsController } from './reviews.controller';
import { authMiddleware } from '../../shared/middlewares/auth.middleware';
import { validate } from '../../shared/middlewares/validate.middleware';
import { createReviewSchema, voteReviewSchema } from './reviews.validators';

const router = Router();
const controller = new ReviewsController();

router.post(
  '/',
  authMiddleware,
  validate(createReviewSchema),
  controller.createReview
);

router.post(
  '/:id/vote',
  authMiddleware,
  validate(voteReviewSchema),
  controller.voteReview
);

router.delete(
  '/:id',
  authMiddleware,
  controller.deleteReview
);

export default router;
