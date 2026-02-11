import { Response } from 'express';
import { serialize } from './serialize';

export type PaginationMeta = {
  page: number;
  pageSize: number;
  total?: number;
  totalItems: number;
  totalPages: number;
};

export type ApiMeta = {
  requestId?: string;
  pagination?: PaginationMeta;
};

export type ApiSuccess<T> = {
  success: true;
  data: T;
  meta?: ApiMeta;
};

export type ApiFailure = {
  success: false;
  error: {
    code: string;
    message: string;
    details?: unknown;
  };
  meta?: ApiMeta;
};

function getRequestId(req: any): string | undefined {
  return req.id ?? req.requestId ?? req.context?.requestId;
}

const withMeta = (req: any, meta?: Omit<ApiMeta, 'requestId'>): ApiMeta | undefined => {
  const requestId = getRequestId(req);
  const merged: ApiMeta = { ...(meta ?? {}), requestId };
  if (!merged.requestId && !merged.pagination) return undefined;
  return merged;
};

export const sendOk = <T>(res: Response, data: T, meta?: Omit<ApiMeta, 'requestId'>) => {
  const body: ApiSuccess<T> = {
    success: true,
    data: serialize(data),
    meta: withMeta(res.req, meta),
  };
  return res.status(200).json(body);
};

export const sendCreated = <T>(res: Response, data: T, meta?: Omit<ApiMeta, 'requestId'>) => {
  const body: ApiSuccess<T> = {
    success: true,
    data: serialize(data),
    meta: withMeta(res.req, meta),
  };
  return res.status(201).json(body);
};

export const sendNoContent = (res: Response) => {
  return res.status(204).send();
};

export const sendFail = (
  res: Response,
  code: string,
  message: string,
  status = 400,
  details?: unknown,
  meta?: Omit<ApiMeta, 'requestId'>
) => {
  const body: ApiFailure = {
    success: false,
    error: { code, message, details: serialize(details) },
    meta: withMeta(res.req, meta),
  };
  return res.status(status).json(body);
};
