import { Request, Response, NextFunction } from 'express';
import { verifyAccessToken } from '../auth/jwt';
import { ApiError } from '../errors/ApiError';
import { prisma } from '../db/prisma';
import { UserRole } from '@prisma/client';

export interface AuthRequest extends Request {
  user?: {
    id: bigint;
    role: UserRole;
  };
}

export const requireAuth = () => {
  return async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const authHeader = req.headers.authorization;
      if (!authHeader?.startsWith('Bearer ')) {
        throw new ApiError(401, 'Please authenticate');
      }

      const token = authHeader.split(' ')[1];
      const payload = verifyAccessToken(token);

      const user = await prisma.user.findUnique({
        where: { id: BigInt(payload.sub) },
        select: { id: true, role: true, isActive: true },
      });

      if (!user || !user.isActive) {
        throw new ApiError(401, 'User not found or inactive');
      }

      req.user = user;
      next();
    } catch (error: any) {
      if (error instanceof ApiError) {
        return next(error);
      }
      const message = error.name === 'TokenExpiredError' ? 'Token expired' : 'Unauthorized';
      next(new ApiError(401, message));
    }
  };
};

export const authMiddleware = requireAuth();

export const requireRole = (allowedRoles: UserRole[]) => {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user || !allowedRoles.includes(req.user.role)) {
      throw new ApiError(403, 'Forbidden');
    }
    next();
  };
};
