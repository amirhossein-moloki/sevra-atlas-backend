import pino from 'pino';
import { config } from '../../config';
import { getRequestId } from '../utils/context';

export const logger = pino({
  level: config.logging.level,
  redact: {
    paths: [
      'password',
      'token',
      'refreshToken',
      'otp',
      'authorization',
      'cookies',
      'headers.authorization',
      'headers.cookie',
      'body.password',
      'body.token',
      'body.refreshToken',
      'body.otp',
      'body.code',
      'merchant',
      'trackId'
    ],
    remove: true,
  },
  mixin() {
    const requestId = getRequestId();
    return requestId ? { requestId } : {};
  },
  transport: config.isDevelopment ? {
    target: 'pino-pretty',
    options: {
      colorize: true,
    },
  } : undefined,
});
