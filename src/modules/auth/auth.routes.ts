import { Router } from 'express';
import { AuthController } from './auth.controller';
import { validate } from '../../shared/middlewares/validate.middleware';
import { requestOtpSchema, verifyOtpSchema, refreshTokenSchema, authResponseSchema } from './auth.validators';
import { rateLimit } from '../../shared/middlewares/rateLimit.middleware';
import { config } from '../../config';
import { requireAuth } from '../../shared/middlewares/auth.middleware';
import { registry, z, withApiSuccess } from '../../shared/openapi/registry';

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
          schema: withApiSuccess(z.object({
            message: z.string()
          }))
        }
      }
    },
  },
});

router.post(
  '/otp/request',
  rateLimit('otp_request', config.auth.otp.rateLimitPerIp, 60),
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
          schema: withApiSuccess(authResponseSchema),
        },
      },
    },
  },
});

router.post(
  '/otp/verify',
  rateLimit('otp_verify', 10, 60),
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
          schema: withApiSuccess(authResponseSchema),
        },
      },
    },
  },
});

router.post(
  '/refresh',
  rateLimit('refresh', 30, 60),
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
  rateLimit('logout', 20, 60),
  validate(refreshTokenSchema),
  controller.logout
);

export default router;
