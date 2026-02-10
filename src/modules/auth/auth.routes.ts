import { Router } from 'express';
import { AuthController } from './auth.controller';
import { validate } from '../../shared/middlewares/validate.middleware';
import { requestOtpSchema, verifyOtpSchema, refreshTokenSchema, authResponseSchema } from './auth.validators';
import { rateLimit } from '../../shared/middlewares/rateLimit.middleware';
import { env } from '../../shared/config/env';
import { requireAuth } from '../../shared/middlewares/auth.middleware';
import { registry, z } from '../../shared/openapi/registry';

const router = Router();
const controller = new AuthController();

const tag = 'Auth';

registry.registerPath({
  method: 'post',
  path: '/auth/otp/request',
  summary: 'Request OTP code',
  tags: [tag],
  request: {
    body: {
      content: {
        'application/json': {
          schema: requestOtpSchema.shape.body,
        },
      },
    },
  },
  responses: {
    200: {
      description: 'OTP sent successfully',
      content: {
        'application/json': {
          schema: z.object({
            success: z.boolean(),
            message: z.string()
          })
        }
      }
    },
  },
});

router.post(
  '/otp/request',
  rateLimit('otp_request', env.OTP_RATE_LIMIT_PER_IP, 60),
  validate(requestOtpSchema),
  controller.requestOtp
);

registry.registerPath({
  method: 'post',
  path: '/auth/otp/verify',
  summary: 'Verify OTP and login',
  tags: [tag],
  request: {
    body: {
      content: {
        'application/json': {
          schema: verifyOtpSchema.shape.body,
        },
      },
    },
  },
  responses: {
    200: {
      description: 'Login successful',
      content: {
        'application/json': {
          schema: authResponseSchema,
        },
      },
    },
  },
});

router.post(
  '/otp/verify',
  validate(verifyOtpSchema),
  controller.verifyOtp
);

registry.registerPath({
  method: 'post',
  path: '/auth/refresh',
  summary: 'Refresh access token',
  tags: [tag],
  request: {
    body: {
      content: {
        'application/json': {
          schema: refreshTokenSchema.shape.body,
        },
      },
    },
  },
  responses: {
    200: {
      description: 'Tokens refreshed',
      content: {
        'application/json': {
          schema: authResponseSchema,
        },
      },
    },
  },
});

router.post(
  '/refresh',
  validate(refreshTokenSchema),
  controller.refresh
);

registry.registerPath({
  method: 'post',
  path: '/auth/logout',
  summary: 'Logout user',
  tags: [tag],
  security: [{ bearerAuth: [] }],
  request: {
    body: {
      content: {
        'application/json': {
          schema: refreshTokenSchema.shape.body,
        },
      },
    },
  },
  responses: {
    204: {
      description: 'Logged out successfully',
    },
  },
});

router.post(
  '/logout',
  requireAuth(),
  validate(refreshTokenSchema),
  controller.logout
);

export default router;
