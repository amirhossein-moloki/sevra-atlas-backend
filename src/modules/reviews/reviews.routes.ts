import { Router } from 'express';
import { ReviewsController } from './reviews.controller';
import { authMiddleware } from '../../shared/middlewares/auth.middleware';
import { validate } from '../../shared/middlewares/validate.middleware';
import { createReviewSchema, voteReviewSchema } from './reviews.validators';
import { registry, z, withApiSuccess } from '../../shared/openapi/registry';

const router = Router();
const controller = new ReviewsController();

const tag = 'Reviews';

registry.registerPath({
  method: 'post',
  path: '/reviews',
  summary: 'Create a review',
  tags: [tag],
  security: [{ bearerAuth: [] }],
  request: {
    body: { content: { 'application/json': { schema: createReviewSchema.shape.body } } }
  },
  responses: {
    201: {
      description: 'Review created',
      content: { 'application/json': { schema: withApiSuccess(z.any()) } }
    }
  }
});
router.post(
  '/',
  authMiddleware,
  validate(createReviewSchema),
  controller.createReview
);

registry.registerPath({
  method: 'post',
  path: '/reviews/{id}/vote',
  summary: 'Vote on a review',
  tags: [tag],
  security: [{ bearerAuth: [] }],
  parameters: [{ name: 'id', in: 'path', schema: { type: 'string' }, required: true }],
  request: {
    body: { content: { 'application/json': { schema: voteReviewSchema.shape.body } } }
  },
  responses: {
    200: {
      description: 'Vote recorded',
      content: { 'application/json': { schema: withApiSuccess(z.any()) } }
    }
  }
});
router.post(
  '/:id/vote',
  authMiddleware,
  validate(voteReviewSchema),
  controller.voteReview
);

registry.registerPath({
  method: 'delete',
  path: '/reviews/{id}',
  summary: 'Delete a review',
  tags: [tag],
  security: [{ bearerAuth: [] }],
  parameters: [{ name: 'id', in: 'path', schema: { type: 'string' }, required: true }],
  responses: {
    200: {
      description: 'Review deleted',
      content: { 'application/json': { schema: withApiSuccess(z.object({ ok: z.boolean() })) } }
    }
  }
});
router.delete(
  '/:id',
  authMiddleware,
  controller.deleteReview
);

export default router;
