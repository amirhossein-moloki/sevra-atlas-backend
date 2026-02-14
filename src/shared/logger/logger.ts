import pino from 'pino';
import { config } from '../../config';
import { getRequestId } from '../utils/context';

export const logger = pino({
  level: config.logging.level,
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
