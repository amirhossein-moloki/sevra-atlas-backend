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
    code: statusCode,
    message,
    ...(env.NODE_ENV === 'development' && { stack: err.stack }),
  };

  if (env.NODE_ENV === 'development') {
    logger.error(err);
  }

  res.status(statusCode).send(response);
};
