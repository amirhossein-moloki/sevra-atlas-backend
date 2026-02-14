import type { Request, Response, NextFunction } from 'express';
import { Prisma } from '@prisma/client';
import httpStatus from 'http-status';
import { ApiFailure } from '../utils/response';
import { config } from '../../config';
import { logger } from '../logger/logger';
import { ApiError } from '../errors/ApiError';

type NormalizedError = {
  status: number;
  code: string;
  message: string;
  details?: unknown;
};

function getRequestId(req: Request): string | undefined {
  return req.requestId;
}

function normalizeError(err: unknown): NormalizedError {
  // 1) AppError (custom)
  if (err instanceof ApiError) {
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
  if (err && typeof err === 'object' && 'code' in err && err.code === '23P01' && 'message' in err && typeof err.message === 'string' && err.message.includes('Booking_no_overlap_active')) {
    return {
      status: 409,
      code: 'BOOKING_OVERLAP',
      message: 'This time slot is already booked for the selected staff member.',
    };
  }

  // 4) Zod validation
  if (err && typeof err === 'object' && 'name' in err && err.name === 'ZodError') {
    const error = err as any;
    return {
      status: 400,
      code: 'VALIDATION_ERROR',
      message: 'Invalid request payload.',
      details: error.errors ?? error.issues ?? error,
    };
  }

  // 5) http-errors like
  if (err && typeof err === 'object') {
    const error = err as Record<string, unknown>;
    const status = (typeof error.status === 'number' ? error.status : (typeof error.statusCode === 'number' ? error.statusCode : undefined));

    if (status) {
      const statusText = httpStatus[status as keyof typeof httpStatus] as string | undefined;
      const code =
        (typeof error.code === 'string' ? error.code : (statusText ? statusText.replace(/\s+/g, '_').toUpperCase() : 'HTTP_ERROR'));

      return {
        status,
        code,
        message: typeof error.message === 'string' ? error.message : (statusText ?? 'Request failed.'),
        details: error.details,
      };
    }
  }

  // 6) default
  return {
    status: 500,
    code: 'INTERNAL_ERROR',
    message: 'An unexpected internal server error occurred.',
  };
}

export function errorHandler(err: unknown, req: Request, res: Response, _next: NextFunction) {
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

  // Only include details in non-production for debugging.
  // In production, we strictly omit details to prevent information leakage (e.g. Prisma metadata).
  const includeDetails = !config.isProduction && !config.isTest;

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
