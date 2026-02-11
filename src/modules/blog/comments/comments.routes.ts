import { Router } from 'express';
import { BlogCommentsController } from './comments.controller';
import { requireAuth, requireStaff, requireAdmin } from '../../../shared/middlewares/auth.middleware';
import { validate } from '../../../shared/middlewares/validate.middleware';
import { updateCommentStatusSchema } from './comments.validators';
import { registry, z, withApiSuccess } from '../../../shared/openapi/registry';
import { CommentSchema } from '../../../shared/openapi/schemas';

const router = Router();
const controller = new BlogCommentsController();

const tag = 'Blog Comments';

registry.registerPath({
  method: 'get',
  path: '/blog/comments',
  summary: 'List all comments',
  tags: [tag],
  responses: {
    200: {
      description: 'List of comments',
      content: { 'application/json': { schema: withApiSuccess(z.array(CommentSchema)) } }
    }
  }
});
router.get('/', controller.listGlobalComments);

registry.registerPath({
  method: 'patch',
  path: '/blog/comments/{id}/status',
  summary: 'Update comment status (Staff)',
  tags: [tag],
  security: [{ bearerAuth: [] }],
  parameters: [{ name: 'id', in: 'path', schema: { type: 'string' }, required: true }],
  request: {
    body: { content: { 'application/json': { schema: updateCommentStatusSchema.shape.body } } }
  },
  responses: {
    200: {
      description: 'Status updated',
      content: { 'application/json': { schema: withApiSuccess(CommentSchema) } }
    }
  }
});
router.patch(
  '/:id/status',
  requireAuth(),
  requireStaff(),
  validate(updateCommentStatusSchema),
  controller.updateCommentStatus
);

registry.registerPath({
  method: 'delete',
  path: '/blog/comments/{id}',
  summary: 'Delete comment (Admin)',
  tags: [tag],
  security: [{ bearerAuth: [] }],
  parameters: [{ name: 'id', in: 'path', schema: { type: 'string' }, required: true }],
  responses: {
    200: {
      description: 'Comment deleted',
      content: { 'application/json': { schema: withApiSuccess(z.object({ ok: z.boolean() })) } }
    }
  }
});
router.delete(
  '/:id',
  requireAuth(),
  requireAdmin(),
  controller.deleteComment
);

export default router;
