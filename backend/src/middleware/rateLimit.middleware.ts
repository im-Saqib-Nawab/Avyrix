import rateLimit from 'express-rate-limit';
import type { Request, Response } from 'express';
import type { ApiErrorResponse } from '@/types/api.types';
import { v4 as uuidv4 } from 'uuid';
import { config } from '@/config';

function rateLimitHandler(
  code: string,
  message: string,
): (req: Request, res: Response<ApiErrorResponse>) => void {
  return (req, res) => {
    const requestId = req.requestId ?? uuidv4();
    res.status(429).json({
      success: false,
      error: {
        code,
        message,
        request_id: requestId,
      },
    });
  };
}

const isDev = config.NODE_ENV === 'development';

export const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: isDev ? 2000 : 400,
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => {
    const path = req.path ?? '';
    return (
      path === '/auth/refresh' ||
      path === '/auth/verify-email' ||
      path.startsWith('/auth/verify-email/')
    );
  },
  handler: rateLimitHandler(
    'RATE_LIMIT_EXCEEDED',
    'Too many requests. Please try again later.',
  ),
});

export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: config.NODE_ENV === 'development' ? 100 : 5,
  standardHeaders: true,
  legacyHeaders: false,
  handler: rateLimitHandler(
    'RATE_LIMIT_EXCEEDED',
    'Too many authentication attempts. Please try again later.',
  ),
});

export const generationLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req: Request): string => req.user?.id ?? req.ip ?? 'anonymous',
  handler: rateLimitHandler(
    'RATE_LIMIT_EXCEEDED',
    'Too many generation requests. Please wait a moment.',
  ),
});
