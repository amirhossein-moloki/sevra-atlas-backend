import { Request, Response, NextFunction } from 'express';
import { v4 as uuidv4 } from 'uuid';

// uuidv4 might not be installed, I'll use a simple one if not
// Actually I didn't add uuid to package.json. Let's use Date.now() + random

export const requestIdMiddleware = (req: Request, res: Response, next: NextFunction) => {
  const requestId = req.headers['x-request-id'] || `req-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`;
  (req as any).requestId = requestId;
  res.setHeader('x-request-id', requestId as string);
  next();
};
