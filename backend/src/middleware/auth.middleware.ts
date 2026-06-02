import type { NextFunction, Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import { verifyAccessToken } from '@/lib/jwt';
import { prisma } from '@/lib/prisma';
import type { ApiErrorResponse } from '@/types/api.types';
import { v4 as uuidv4 } from 'uuid';

export async function authMiddleware(
  req: Request,
  res: Response<ApiErrorResponse>,
  next: NextFunction,
): Promise<void> {
  const requestId = req.requestId ?? uuidv4();

  const authHeader = req.headers.authorization;
  const token = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : null;

  if (!token) {
    res.status(401).json({
      success: false,
      error: {
        code: 'UNAUTHORIZED',
        message: 'Authentication required. Please log in.',
        request_id: requestId,
      },
    });
    return;
  }

  try {
    const payload = verifyAccessToken(token);
    const user = await prisma.user.findUnique({
      where: { id: payload.userId },
      select: {
        id: true,
        email: true,
        role: true,
        credit_balance: true,
        is_verified: true,
      },
    });

    if (!user) {
      res.status(401).json({
        success: false,
        error: {
          code: 'UNAUTHORIZED',
          message: 'Authentication required. Please log in.',
          request_id: requestId,
        },
      });
      return;
    }

    req.user = {
      id: user.id,
      email: user.email,
      role: user.role,
      credit_balance: user.credit_balance,
    };

    next();
  } catch (error) {
    const isExpired = error instanceof jwt.TokenExpiredError;
    res.status(isExpired ? 403 : 401).json({
      success: false,
      error: {
        code: isExpired ? 'TOKEN_EXPIRED' : 'UNAUTHORIZED',
        message: isExpired
          ? 'Your session has expired. Please log in again.'
          : 'Authentication required. Please log in.',
        request_id: requestId,
      },
    });
  }
}
