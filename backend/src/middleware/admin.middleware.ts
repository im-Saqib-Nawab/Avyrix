import type { NextFunction, Request, Response } from 'express';
import type { ApiErrorResponse } from '@/types/api.types';
import { v4 as uuidv4 } from 'uuid';

export function adminMiddleware(
  req: Request,
  res: Response<ApiErrorResponse>,
  next: NextFunction,
): void {
  const requestId = req.requestId ?? uuidv4();

  if (!req.user || req.user.role !== 'admin') {
    res.status(403).json({
      success: false,
      error: {
        code: 'FORBIDDEN',
        message: 'Access denied. Admin privileges required.',
        request_id: requestId,
      },
    });
    return;
  }

  next();
}
