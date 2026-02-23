import { UserRole } from '@prisma/client';
import { ApiMeta } from '../shared/utils/response';

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      actor?: {
        id?: string;
        actorId?: string;
        role?: UserRole;
        salonId?: string;
        actorType?: unknown;
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
      ok<T>(data: T, message?: string): Response;
      paginated<T>(data: T[], meta: any, message?: string): Response;
      created<T>(data: T): Response;
      noContent(): Response;
      fail(
        code: string,
        message: string,
        status?: number
      ): Response;
    }
  }
}

export {};
