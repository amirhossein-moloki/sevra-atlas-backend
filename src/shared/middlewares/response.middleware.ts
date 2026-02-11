import { Request, Response, NextFunction } from 'express';
import * as responseUtils from '../utils/response';
import { serialize } from '../utils/serialize';

export function responseMiddleware(req: Request, res: Response, next: NextFunction) {
  const originalJson = res.json;

  // @ts-ignore - Patching res.json to ensure all responses follow the envelope pattern
  res.json = function (body: any) {
    const isSuccess = res.statusCode >= 200 && res.statusCode < 300;
    const isAlreadyWrapped = body && typeof body === 'object' && 'success' in body;

    if (isSuccess && !isAlreadyWrapped && body !== undefined) {
      let data = body;
      let meta: any = { requestId: (req as any).requestId };

      // Flatten paginated responses
      if (body && typeof body === 'object' && 'data' in body && 'meta' in body) {
        data = body.data;
        meta = { pagination: body.meta, ...meta };
      }

      return originalJson.call(this, {
        success: true,
        data: serialize(data),
        meta,
      });
    }

    // Even if already wrapped or not success, ensure BigInt/Date are serialized
    const serializedBody = serialize(body);
    return originalJson.call(this, serializedBody);
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
