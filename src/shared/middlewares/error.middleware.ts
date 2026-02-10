import type { Request, Response, NextFunction } from 'express';
import { Prisma } from '@prisma/client';
import httpStatus from 'http-status';
import { ApiFailure } from '../utils/response';
import { env } from '../config/env';
import { logger } from '../logger/logger';

type NormalizedError = {
  status: number;
  code: string;
  message: string;
  details?: unknown;
};

function getRequestId(req: Request): string | undefined {
  const anyReq = req as any;
  return anyReq.id ?? anyReq.requestId ?? anyReq.context?.requestId;
}

function normalizeError(err: any): NormalizedError {
  // 1) AppError (custom)
  if (err.isOperational) {
    return {
      status: err.statusCode,
      code: err.code || 'APP_ERROR',
      message: err.message,
      details: err.details,
    };
  }

  // 2) Prisma known errors
  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    switch (err.code) {
      case 'P2002': {
        const target = err.meta?.target;
        const message = Array.isArray(target)
          ? `Duplicate value for field(s): ${target.join(', ')}`
          : 'Duplicate value for field';
        return { status: 409, code: 'CONFLICT', message, details: err.meta };
      }
      case 'P2025':
        return {
          status: 404,
          code: 'NOT_FOUND',
          message: 'The requested record was not found.',
          details: err.meta,
        };
      default:
        return {
          status: 400,
          code: 'DB_REQUEST_FAILED',
          message: 'Database request failed.',
          details: { prismaCode: err.code, meta: err.meta },
        };
    }
  }

  // 3) Postgres exclusion constraint (booking overlap)
  if (err.code === '23P01' && err.message?.includes('Booking_no_overlap_active')) {
    return {
      status: 409,
      code: 'BOOKING_OVERLAP',
      message: 'This time slot is already booked for the selected staff member.',
    };
  }

  // 4) Zod validation
  if (err?.name === 'ZodError') {
    return {
      status: 400,
      code: 'VALIDATION_ERROR',
      message: 'Invalid request payload.',
      details: err.errors ?? err.issues ?? err,
    };
  }

  // 5) http-errors like
  if (typeof err?.status === 'number' || typeof err?.statusCode === 'number') {
    const status = err.status ?? err.statusCode;
    const statusText = (httpStatus as any)[status] as string | undefined;
    const code =
      err.code ?? (statusText ? (statusText as string).replace(/\s+/g, '_').toUpperCase() : 'HTTP_ERROR');

    return {
      status,
      code,
      message: err.message ?? statusText ?? 'Request failed.',
      details: err.details,
    };
  }

  // 6) default
  return {
    status: 500,
    code: 'INTERNAL_ERROR',
    message: 'An unexpected internal server error occurred.',
  };
}

export function errorHandler(err: any, req: Request, res: Response, _next: NextFunction) {
  const requestId = getRequestId(req);
  const normalized = normalizeError(err);

  if (res.headersSent) return;

  const isServerError = normalized.status >= 500;

  // Log the error
  const logData = {
    method: req.method,
    url: req.originalUrl,
    status: normalized.status,
    code: normalized.code,
    ...(normalized.details ? { details: normalized.details } : {}),
  };

  if (isServerError) {
    logger.error({ err, ...logData }, `Server Error: ${normalized.message}`);
  } else {
    logger.warn(logData, `Operational Error: ${normalized.message}`);
  }

  const includeDetails = !isServerError || env.NODE_ENV !== 'production';

  const body: ApiFailure = {
    success: false,
    error: {
      code: normalized.code,
      message: normalized.message,
      ...(includeDetails && normalized.details ? { details: normalized.details } : {}),
    },
    meta: { requestId },
  };

  res.status(normalized.status).json(body);
}
