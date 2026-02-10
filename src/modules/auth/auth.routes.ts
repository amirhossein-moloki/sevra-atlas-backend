import { Router } from 'express';
import { AuthController } from './auth.controller';
import { validate } from '../../shared/middlewares/validate.middleware';
import { requestOtpSchema, verifyOtpSchema, refreshTokenSchema } from './auth.validators';
import { rateLimit } from '../../shared/middlewares/rateLimit.middleware';
import { env } from '../../shared/config/env';
import { requireAuth } from '../../shared/middlewares/auth.middleware';

const router = Router();
const controller = new AuthController();

router.post(
  '/otp/request',
  rateLimit('otp_request', env.OTP_RATE_LIMIT_PER_IP, 60), // IP limit
  validate(requestOtpSchema),
  controller.requestOtp
);

router.post(
  '/otp/verify',
  validate(verifyOtpSchema),
  controller.verifyOtp
);

router.post(
  '/refresh',
  validate(refreshTokenSchema),
  controller.refresh
);

router.post(
  '/logout',
  requireAuth(),
  validate(refreshTokenSchema),
  controller.logout
);

export default router;
