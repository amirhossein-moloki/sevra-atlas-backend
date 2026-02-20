import { Router } from 'express';
import { AdminAuthController } from './admin.auth.controller';
import { validate } from '../../../shared/middlewares/validate.middleware';
import { adminLoginSchema } from './admin.auth.validators';
import { registry, z, withApiSuccess } from '../../../shared/openapi/registry';

const router = Router();
const controller = new AdminAuthController();

const tag = 'Admin Auth';

const adminAuthResponseSchema = z.object({
  accessToken: z.string(),
  refreshToken: z.string(),
  user: z.object({
    id: z.string(),
    username: z.string().nullable(),
    email: z.string().nullable(),
    role: z.string(),
  }),
}).openapi('AdminAuthResponse');

registry.registerPath({
  method: 'post',
  path: '/admin/auth/login',
  summary: 'Admin login with password',
  tags: [tag],
  request: {
    body: {
      content: {
        'application/json': {
          schema: adminLoginSchema.shape.body,
        },
      },
    },
  },
  responses: {
    200: {
      description: 'Login successful',
      content: {
        'application/json': {
          schema: withApiSuccess(adminAuthResponseSchema),
        },
      },
    },
  },
});

router.post(
  '/login',
  validate(adminLoginSchema),
  controller.login
);

export default router;
