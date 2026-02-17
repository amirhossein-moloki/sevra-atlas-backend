import { logger } from '../logger/logger';

/**
 * Executes a promise in the background and logs any errors.
 * Prevents silent failures and unhandled rejections.
 */
export function runInBackground(promise: Promise<unknown>, context: string, metadata: Record<string, unknown> = {}) {
  promise.catch((err) => {
    logger.error({
      msg: `Background task failed: ${context}`,
      err,
      ...metadata
    });
  });
}
