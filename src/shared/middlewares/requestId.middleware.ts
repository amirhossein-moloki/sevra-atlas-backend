import { Request, Response, NextFunction } from 'express';
import { runWithContext } from '../utils/context';

export const requestIdMiddleware = (req: Request, res: Response, next: NextFunction) => {
  const requestId = (req.headers['x-request-id'] as string) || `req-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;

  req.requestId = requestId;
  res.setHeader('x-request-id', requestId);

  runWithContext({ requestId }, () => {
    next();
  });
};
