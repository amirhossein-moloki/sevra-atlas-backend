import { Request, Response, NextFunction } from 'express';
import '../../types/express';
import * as responseUtils from '../utils/response';
import { serialize } from '../utils/serialize';

export function responseMiddleware(_req: Request, res: Response, next: NextFunction) {
  const originalJson = res.json.bind(res);

  res.json = function (body: unknown): Response {
    const isSuccess = res.statusCode >= 200 && res.statusCode < 300;
    const isAlreadyWrapped = body && typeof body === 'object' && 'success' in body;

    if (isSuccess && !isAlreadyWrapped && body !== undefined && body !== null) {
      return originalJson.call(this, {
        success: true,
        data: serialize(body),
      });
    }

    // Even if already wrapped or not success, ensure BigInt/Date are serialized
    const serializedBody = serialize(body);
    return originalJson.call(this, serializedBody);
  };

  res.ok = function <T>(data: T) {
    return responseUtils.sendOk(res, data);
  };

  res.created = function <T>(data: T) {
    return responseUtils.sendCreated(res, data);
  };

  res.noContent = function () {
    return responseUtils.sendNoContent(res);
  };

  res.fail = function (
    code: string,
    message: string,
    status = 400
  ) {
    return responseUtils.sendFail(res, code, message, status);
  };

  next();
}
