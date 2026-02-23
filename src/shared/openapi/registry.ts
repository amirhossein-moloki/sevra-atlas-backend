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
  pageSize: z.number().optional(),
  limit: z.number().optional(),
  total: z.number().optional(),
  totalItems: z.number().optional(),
  totalPages: z.number().optional(),
}).openapi('PaginationMeta', { type: 'object' });

export const ApiMetaSchema = z.object({
  requestId: z.string().optional(),
  pagination: PaginationMetaSchema.optional(),
}).openapi('ApiMeta', { type: 'object' });

export function withApiSuccess<T extends z.ZodTypeAny>(dataSchema: T) {
  return z.object({
    success: z.literal(true),
    data: dataSchema,
  });
}

export function withApiFailure() {
  return z.object({
    success: z.literal(false),
    data: z.null(),
    message: z.string(),
  });
}

registry.register('ApiFailure', withApiFailure());

export { z };
