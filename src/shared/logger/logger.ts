import pino from 'pino';
import { env } from '../config/env';
import { getRequestId } from '../utils/context';

export const logger = pino({
  level: env.NODE_ENV === 'development' ? 'debug' : 'info',
  mixin() {
    const requestId = getRequestId();
    return requestId ? { requestId } : {};
  },
  transport: env.NODE_ENV === 'development' ? {
    target: 'pino-pretty',
    options: {
      colorize: true,
    },
  } : undefined,
});
