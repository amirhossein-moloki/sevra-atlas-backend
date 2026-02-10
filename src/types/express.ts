import { UserRole } from '@prisma/client';
import { ApiMeta } from '../shared/utils/response';

declare global {
  namespace Express {
    export interface Request {
      actor?: {
        id?: string;
        actorId?: string;
        role?: UserRole;
        salonId?: string;
        actorType?: any;
      };
      salonId?: string;
      id?: string;
      requestId?: string;
      rawBody?: Buffer;
      user?: any; // Support existing code that uses req.user
    }

    export interface Response {
      ok<T>(data: T, meta?: Omit<ApiMeta, 'requestId'>): Response;
      created<T>(data: T, meta?: Omit<ApiMeta, 'requestId'>): Response;
      noContent(): Response;
      fail(
        code: string,
        message: string,
        status?: number,
        details?: unknown,
        meta?: Omit<ApiMeta, 'requestId'>
      ): Response;
    }
  }
}
