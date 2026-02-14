import { UserRole } from '@prisma/client';
import { ApiMeta } from '../shared/utils/response';

declare global {
  namespace Express {
    interface Request {
      actor?: {
        id?: string;
        actorId?: string;
        role?: UserRole;
        salonId?: string;
        actorType?: any;
      };
      salonId?: string;
      requestId?: string;
      rawBody?: Buffer;
      user?: {
        id: bigint;
        role: UserRole;
      };
    }

    interface Response {
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

export {};
