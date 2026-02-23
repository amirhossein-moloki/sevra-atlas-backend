import { Request, Response } from 'express';
import { serialize } from './serialize';

export type PaginationMeta = {
  page: number;
  pageSize: number;
  total: number;
  totalPages?: number;
};

export type ApiMeta = {
  requestId?: string;
  pagination?: PaginationMeta;
};

export type ApiSuccess<T> = {
  success: true;
  data: T;
  message?: string;
};

export type ApiPaginatedSuccess<T> = {
  success: true;
  data: T[];
  meta: PaginationMeta;
  message: string;
};

export type ApiFailure = {
  success: false;
  data: any;
  message: string;
};

export const sendOk = <T>(res: Response, data: T, message?: string) => {
  const body: ApiSuccess<T> = {
    success: true,
    data: serialize(data),
    ...(message ? { message } : {}),
  };
  return res.status(200).json(body);
};

export const sendPaginated = <T>(
  res: Response,
  data: T[],
  meta: PaginationMeta,
  message = 'Resources retrieved successfully'
) => {
  const body: ApiPaginatedSuccess<T> = {
    success: true,
    data: (serialize(data) as T[]) || [],
    meta: {
      ...meta,
      totalPages: meta.totalPages ?? Math.ceil(meta.total / (meta.pageSize || 1)),
    },
    message,
  };
  return res.status(200).json(body);
};

export const sendCreated = <T>(res: Response, data: T) => {
  const body: ApiSuccess<T> = {
    success: true,
    data: serialize(data),
  };
  return res.status(201).json(body);
};

export const sendNoContent = (res: Response) => {
  return res.status(204).send();
};

export const sendFail = (
  res: Response,
  _code: string,
  message: string,
  status = 400
) => {
  const body: ApiFailure = {
    success: false,
    data: null,
    message,
  };
  return res.status(status).json(body);
};
