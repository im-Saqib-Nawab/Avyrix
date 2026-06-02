import type { NextFunction, Request, Response } from 'express';
import { ZodError } from 'zod';
import { Prisma } from '@prisma/client';

function isDatabaseUnavailableError(err: Error): boolean {
  if (err instanceof Prisma.PrismaClientInitializationError) return true;
  const message = err.message.toLowerCase();
  return (
    message.includes("can't reach database server") ||
    message.includes('connection') && message.includes('refused') ||
    err.name === 'PrismaClientInitializationError'
  );
}
import { JsonWebTokenError, TokenExpiredError } from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';
import type { ApiErrorResponse } from '@/types/api.types';
import { logger } from '@/services/logger.service';
import { AppError } from '@/lib/appError';

export { AppError };

function formatZodMessage(error: ZodError): string {
  return error.issues.map((issue) => `${issue.path.join('.')}: ${issue.message}`).join('; ');
}

function prismaConflictMessage(error: Prisma.PrismaClientKnownRequestError): string {
  const target = error.meta?.target;
  if (Array.isArray(target) && target.includes('email')) {
    return 'An account with this email already exists.';
  }
  return 'A record with this value already exists.';
}

export function errorMiddleware(
  err: Error,
  req: Request,
  res: Response<ApiErrorResponse>,
  _next: NextFunction,
): void {
  const requestId = req.requestId ?? uuidv4();

  logger.error('Request error', {
    request_id: requestId,
    user_id: req.user?.id,
    message: err.message,
    stack: err.stack,
    name: err.name,
  });

  if (err instanceof ZodError) {
    res.status(400).json({
      success: false,
      error: {
        code: 'VALIDATION_ERROR',
        message: formatZodMessage(err),
        request_id: requestId,
      },
    });
    return;
  }

  if (err instanceof AppError) {
    res.status(err.statusCode).json({
      success: false,
      error: {
        code: err.code,
        message: err.message,
        request_id: requestId,
      },
    });
    return;
  }

  if (isDatabaseUnavailableError(err)) {
    res.status(503).json({
      success: false,
      error: {
        code: 'SERVICE_UNAVAILABLE',
        message:
          'Database is temporarily unavailable. Check your DATABASE_URL and that your Neon project is active.',
        request_id: requestId,
      },
    });
    return;
  }

  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    logger.error('Prisma error', {
      request_id: requestId,
      prisma_code: err.code,
      meta: err.meta,
    });

    if (err.code === 'P2002') {
      res.status(409).json({
        success: false,
        error: {
          code: 'CONFLICT',
          message: prismaConflictMessage(err),
          request_id: requestId,
        },
      });
      return;
    }

    if (err.code === 'P2025') {
      res.status(404).json({
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: 'The requested resource was not found.',
          request_id: requestId,
        },
      });
      return;
    }

    if (err.code === 'P2021') {
      res.status(503).json({
        success: false,
        error: {
          code: 'SERVICE_UNAVAILABLE',
          message:
            'Database schema is not ready. Run `npx prisma migrate deploy` in the backend folder.',
          request_id: requestId,
        },
      });
      return;
    }

    res.status(500).json({
      success: false,
      error: {
        code: 'DATABASE_ERROR',
        message: 'Something went wrong. Please try again.',
        request_id: requestId,
      },
    });
    return;
  }

  if (err instanceof JsonWebTokenError || err instanceof TokenExpiredError) {
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

  res.status(500).json({
    success: false,
    error: {
      code: 'INTERNAL_ERROR',
      message: 'Something went wrong. Please try again.',
      request_id: requestId,
    },
  });
}
