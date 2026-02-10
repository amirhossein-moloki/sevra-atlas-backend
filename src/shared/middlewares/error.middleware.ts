import { Request, Response, NextFunction } from 'express';
import { ApiError } from '../errors/ApiError';
import { logger } from '../logger/logger';
import { env } from '../config/env';

export const errorMiddleware = (
  err: Error | ApiError,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  let { statusCode, message } = err as any;

  if (!(err instanceof ApiError)) {
    statusCode = 500;
    message = env.NODE_ENV === 'production' ? 'Internal Server Error' : err.message;
  }

  res.locals.errorMessage = err.message;

  const response = {
    error: {
      code: getErrorCode(statusCode),
      message,
      requestId: (req as any).requestId,
      ...(env.NODE_ENV === 'development' && { stack: err.stack }),
    }
  };

  if (env.NODE_ENV === 'development') {
    logger.error(err);
  }

  res.status(statusCode).send(response);
};

function getErrorCode(statusCode: number): string {
  switch (statusCode) {
    case 400: return 'VALIDATION_ERROR';
    case 401: return 'UNAUTHORIZED';
    case 403: return 'FORBIDDEN';
    case 404: return 'NOT_FOUND';
    case 409: return 'CONFLICT';
    case 429: return 'RATE_LIMITED';
    default: return 'INTERNAL_ERROR';
  }
}
