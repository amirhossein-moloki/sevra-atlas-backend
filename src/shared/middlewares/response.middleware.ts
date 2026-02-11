import { Request, Response, NextFunction } from 'express';
import * as responseUtils from '../utils/response';

export function responseMiddleware(req: Request, res: Response, next: NextFunction) {
  const originalJson = res.json;

  // @ts-ignore - Patching res.json to ensure all responses follow the envelope pattern
  res.json = function (body: any) {
    const isSuccess = res.statusCode >= 200 && res.statusCode < 300;
    const isAlreadyWrapped = body && typeof body === 'object' && 'success' in body;

    if (isSuccess && !isAlreadyWrapped && body !== undefined) {
      return originalJson.call(this, {
        success: true,
        data: body,
        meta: { requestId: (req as any).requestId },
      });
    }
    return originalJson.call(this, body);
  };

  res.ok = function <T>(data: T, meta?: Omit<responseUtils.ApiMeta, 'requestId'>) {
    return responseUtils.sendOk(res, data, meta);
  };

  res.created = function <T>(data: T, meta?: Omit<responseUtils.ApiMeta, 'requestId'>) {
    return responseUtils.sendCreated(res, data, meta);
  };

  res.noContent = function () {
    return responseUtils.sendNoContent(res);
  };

  res.fail = function (
    code: string,
    message: string,
    status = 400,
    details?: unknown,
    meta?: Omit<responseUtils.ApiMeta, 'requestId'>
  ) {
    return responseUtils.sendFail(res, code, message, status, details, meta);
  };

  next();
}
