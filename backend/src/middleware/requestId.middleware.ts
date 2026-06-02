import type { NextFunction, Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';

export function requestIdMiddleware(req: Request, _res: Response, next: NextFunction): void {
  const incoming = req.headers['x-request-id'];
  req.requestId =
    typeof incoming === 'string' && incoming.length > 0 ? incoming : uuidv4();
  next();
}
