import { OpenAPIRegistry, extendZodWithOpenApi } from '@asteasolutions/zod-to-openapi';
import { z } from 'zod';

extendZodWithOpenApi(z);

export const registry = new OpenAPIRegistry();

/**
 * Standard API Response Envelope Helpers
 * These ensure Zod schemas match the responseMiddleware output.
 */

export const PaginationMetaSchema = z.object({
  page: z.number(),
  pageSize: z.number(),
  total: z.number().optional(),
  totalItems: z.number(),
  totalPages: z.number(),
}).openapi('PaginationMeta');

export const ApiMetaSchema = z.object({
  requestId: z.string().optional(),
  pagination: PaginationMetaSchema.optional(),
}).openapi('ApiMeta');

export function withApiSuccess<T extends z.ZodTypeAny>(dataSchema: T) {
  return z.object({
    success: z.literal(true),
    data: dataSchema,
    meta: ApiMetaSchema.optional(),
  });
}

export function withApiFailure(detailsSchema: z.ZodTypeAny = z.unknown()) {
  return z.object({
    success: z.literal(false),
    error: z.object({
      code: z.string(),
      message: z.string(),
      details: detailsSchema.optional(),
    }),
    meta: ApiMetaSchema.optional(),
  });
}

export { z };
