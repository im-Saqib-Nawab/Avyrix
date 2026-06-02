import winston from 'winston';
import path from 'path';
import { LogLevel, Prisma } from '@prisma/client';
import { config } from '@/config';
import { prisma } from '@/lib/prisma';

const SENSITIVE_KEYS = [
  'password',
  'token',
  'accessToken',
  'refreshToken',
  'authorization',
  'api_key',
  'apiKey',
  'secret',
  'SMTP_PASS',
  'JWT_SECRET',
];

function sanitizeMeta(meta: Record<string, unknown>): Record<string, unknown> {
  const result: Record<string, unknown> = {};

  for (const [key, value] of Object.entries(meta)) {
    const lowerKey = key.toLowerCase();
    if (SENSITIVE_KEYS.some((sensitive) => lowerKey.includes(sensitive.toLowerCase()))) {
      result[key] = '[REDACTED]';
      continue;
    }

    if (value && typeof value === 'object' && !Array.isArray(value)) {
      result[key] = sanitizeMeta(value as Record<string, unknown>);
    } else {
      result[key] = value;
    }
  }

  return result;
}

const transports: winston.transport[] = [
  new winston.transports.File({
    filename: path.join('logs', 'error.log'),
    level: 'error',
  }),
  new winston.transports.File({
    filename: path.join('logs', 'combined.log'),
  }),
];

if (config.NODE_ENV === 'development') {
  transports.push(
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.timestamp(),
        winston.format.printf(({ level, message, timestamp, ...meta }) => {
          const metaStr = Object.keys(meta).length ? ` ${JSON.stringify(sanitizeMeta(meta))}` : '';
          return `${timestamp} ${level}: ${message}${metaStr}`;
        }),
      ),
    }),
  );
}

export const logger = winston.createLogger({
  level: config.NODE_ENV === 'development' ? 'debug' : 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json(),
  ),
  transports,
});

function mapWinstonLevelToPrisma(level: string): LogLevel {
  switch (level) {
    case 'error':
      return LogLevel.error;
    case 'warn':
      return LogLevel.warn;
    case 'debug':
      return LogLevel.debug;
    default:
      return LogLevel.info;
  }
}

export async function logToDb(
  level: LogLevel,
  service: string,
  message: string,
  meta?: Record<string, unknown>,
): Promise<void> {
  try {
    const safeMeta = meta ? sanitizeMeta(meta) : undefined;

    await prisma.systemLog.create({
      data: {
        level,
        service,
        message,
        meta: safeMeta ? (safeMeta as Prisma.InputJsonValue) : undefined,
        request_id: typeof safeMeta?.request_id === 'string' ? safeMeta.request_id : undefined,
        user_id: typeof safeMeta?.user_id === 'string' ? safeMeta.user_id : undefined,
      },
    });
  } catch (error) {
    logger.warn('Failed to write log to database', {
      service,
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}

export async function logToDbFromWinston(
  winstonLevel: string,
  service: string,
  message: string,
  meta?: Record<string, unknown>,
): Promise<void> {
  await logToDb(mapWinstonLevelToPrisma(winstonLevel), service, message, meta);
}
