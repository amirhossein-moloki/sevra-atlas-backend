import { Request, Response, NextFunction } from 'express';
import * as responseUtils from '../utils/response';
import { serialize } from '../utils/serialize';

export function responseMiddleware(req: Request, res: Response, next: NextFunction) {
  const originalJson = res.json.bind(res);

  res.json = function (body: unknown): Response {
    const isSuccess = res.statusCode >= 200 && res.statusCode < 300;
    const isAlreadyWrapped = body && typeof body === 'object' && 'success' in body;

    if (isSuccess && !isAlreadyWrapped && body !== undefined && body !== null) {
      let data: unknown = body;
      let meta: responseUtils.ApiMeta = { requestId: req.requestId };

      // Flatten paginated responses
      if (typeof body === 'object' && 'data' in body && 'meta' in body) {
        const bodyObj = body as Record<string, unknown>;
        data = bodyObj.data;
        meta = { pagination: bodyObj.meta as responseUtils.PaginationMeta, ...meta };
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
