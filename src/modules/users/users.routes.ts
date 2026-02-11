import { Router } from 'express';
import { UsersController } from './users.controller';
import { FollowsController } from '../follows/follows.controller';
import { SavesController } from '../saves/saves.controller';
import { requireAuth, requireAdmin } from '../../shared/middlewares/auth.middleware';
import { validate } from '../../shared/middlewares/validate.middleware';
import { userSchema, updateMeSchema, updateRoleSchema, updateStatusSchema } from './users.validators';
import { registry, z, withApiSuccess } from '../../shared/openapi/registry';

const router = Router();
const controller = new UsersController();
const followsController = new FollowsController();
const savesController = new SavesController();

const tag = 'Users';

// Me endpoints
registry.registerPath({
  method: 'get',
  path: '/me',
  summary: 'Get current user profile',
  tags: [tag],
  security: [{ bearerAuth: [] }],
  responses: {
    200: {
      description: 'Current user profile',
      content: { 'application/json': { schema: withApiSuccess(userSchema) } },
    },
  },
});
router.get('/me', requireAuth(), controller.getMe);

registry.registerPath({
  method: 'get',
  path: '/me/follows',
  summary: 'Get my follows',
  tags: [tag],
  security: [{ bearerAuth: [] }],
  responses: {
    200: {
      description: 'List of follows',
      content: {
        'application/json': {
          schema: withApiSuccess(z.object({
            data: z.array(z.any()), // Simplified for now
          })),
        },
      },
    },
  },
});
router.get('/me/follows', requireAuth(), followsController.getMyFollows);

registry.registerPath({
  method: 'get',
  path: '/me/saves',
  summary: 'Get my saved items',
  tags: [tag],
  security: [{ bearerAuth: [] }],
  responses: {
    200: {
      description: 'List of saved items',
      content: {
        'application/json': {
          schema: withApiSuccess(z.object({
            data: z.array(z.any()), // Simplified for now
          })),
        },
      },
    },
  },
});
router.get('/me/saves', requireAuth(), savesController.getMySaves);

registry.registerPath({
  method: 'patch',
  path: '/me',
  summary: 'Update current user profile',
  tags: [tag],
  security: [{ bearerAuth: [] }],
  request: {
    body: {
      content: { 'application/json': { schema: updateMeSchema.shape.body } },
    },
  },
  responses: {
    200: {
      description: 'Profile updated',
      content: {
        'application/json': {
          schema: withApiSuccess(z.object({
            ok: z.boolean(),
            user: userSchema,
          })),
        },
      },
    },
  },
});
router.patch('/me', requireAuth(), validate(updateMeSchema), controller.updateMe);

// Admin endpoints
registry.registerPath({
  method: 'get',
  path: '/admin/users',
  summary: 'List all users (Admin)',
  tags: [tag],
  security: [{ bearerAuth: [] }],
  parameters: [
    { name: 'q', in: 'query', schema: { type: 'string' } },
    { name: 'role', in: 'query', schema: { type: 'string' } },
    { name: 'status', in: 'query', schema: { type: 'string' } },
    { name: 'page', in: 'query', schema: { type: 'integer' } },
    { name: 'pageSize', in: 'query', schema: { type: 'integer' } },
  ],
  responses: {
    200: {
      description: 'List of users',
      content: {
        'application/json': {
          schema: withApiSuccess(z.object({
            data: z.array(userSchema),
            meta: z.object({
              page: z.number(),
              pageSize: z.number(),
              total: z.number(),
              totalPages: z.number(),
            }),
          })),
        },
      },
    },
  },
});
router.get('/admin/users', requireAuth(), requireAdmin(), controller.listUsers);

registry.registerPath({
  method: 'patch',
  path: '/admin/users/{id}/role',
  summary: 'Update user role (Admin)',
  tags: [tag],
  security: [{ bearerAuth: [] }],
  parameters: [{ name: 'id', in: 'path', schema: { type: 'string' }, required: true }],
  request: {
    body: {
      content: { 'application/json': { schema: updateRoleSchema.shape.body } },
    },
  },
  responses: {
    200: {
      description: 'Role updated',
      content: {
        'application/json': {
          schema: withApiSuccess(z.object({ ok: z.boolean() })),
        },
      },
    },
  },
});
router.patch('/admin/users/:id/role', requireAuth(), requireAdmin(), validate(updateRoleSchema), controller.updateRole);

registry.registerPath({
  method: 'patch',
  path: '/admin/users/{id}/status',
  summary: 'Update user status (Admin)',
  tags: [tag],
  security: [{ bearerAuth: [] }],
  parameters: [{ name: 'id', in: 'path', schema: { type: 'string' }, required: true }],
  request: {
    body: {
      content: { 'application/json': { schema: updateStatusSchema.shape.body } },
    },
  },
  responses: {
    200: {
      description: 'Status updated',
      content: {
        'application/json': {
          schema: withApiSuccess(z.object({ ok: z.boolean() })),
        },
      },
    },
  },
});
router.patch('/admin/users/:id/status', requireAuth(), requireAdmin(), validate(updateStatusSchema), controller.updateStatus);

export default router;
