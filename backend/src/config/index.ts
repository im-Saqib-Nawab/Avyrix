import { z } from 'zod';
import dotenv from 'dotenv';

dotenv.config();

const envSchema = z.object({
  PORT: z.string().default('3001'),
  NODE_ENV: z.enum(['development', 'staging', 'production']).default('development'),
  DATABASE_URL: z.string(),
  /** TCP Redis URL for Bull queues (optional — e.g. Upstash rediss:// URL). REST URL is not supported by Bull. */
  REDIS_URL: z.string().optional(),
  /** Alternative to REDIS_URL — Upstash TCP endpoint from dashboard */
  UPSTASH_REDIS_URL: z.string().optional(),
  JWT_SECRET: z.string().min(32),
  JWT_REFRESH_SECRET: z.string().min(32),
  JWT_ACCESS_EXPIRES_IN: z.string().default('15m'),
  JWT_REFRESH_EXPIRES_IN: z.string().default('7d'),
  FRONTEND_URL: z.string(),
  OPENAI_API_KEY: z.string(),
  KLING_ACCESS_KEY: z.string(),
  KLING_SECRET_KEY: z.string(),
  HEYGEN_API_KEY: z.string(),
  AWS_ACCESS_KEY_ID: z.string().optional(),
  AWS_SECRET_ACCESS_KEY: z.string().optional(),
  AWS_BUCKET_NAME: z.string().optional(),
  AWS_REGION: z.string().optional(),
  CLOUDINARY_CLOUD_NAME: z.string().optional(),
  CLOUDINARY_API_KEY: z.string().optional(),
  CLOUDINARY_API_SECRET: z.string().optional(),
  /** Optional — set for Cloudflare R2 or other S3-compatible endpoints */
  STORAGE_ENDPOINT: z.string().optional(),
  /** Optional — public CDN/base URL (e.g. https://media.avyrix.ai) */
  STORAGE_PUBLIC_URL_BASE: z.string().optional(),
  STRIPE_SECRET_KEY: z.string(),
  STRIPE_PUBLISHABLE_KEY: z.string(),
  STRIPE_WEBHOOK_SECRET: z.string(),
  SMTP_HOST: z.string(),
  SMTP_PORT: z.string(),
  SMTP_USER: z.string(),
  SMTP_PASS: z.string(),
  SMTP_FROM: z.string(),
  ADMIN_SECRET_KEY: z.string(),
});

const parsed = envSchema.parse(process.env);

/** Resolved TCP Redis URL for Bull/ioredis, or null when queues should use in-process fallback. */
export function getQueueRedisUrl(): string | null {
  const candidate = (parsed.UPSTASH_REDIS_URL ?? parsed.REDIS_URL ?? '').trim();
  if (!candidate) return null;
  if (candidate === 'redis://localhost:6379' && parsed.NODE_ENV === 'development') {
    return null;
  }
  return candidate;
}

export const config = {
  ...parsed,
  AWS_ACCESS_KEY_ID: parsed.AWS_ACCESS_KEY_ID ?? '',
  AWS_SECRET_ACCESS_KEY: parsed.AWS_SECRET_ACCESS_KEY ?? '',
  AWS_BUCKET_NAME: parsed.AWS_BUCKET_NAME ?? 'avyrix-media',
  AWS_REGION: parsed.AWS_REGION ?? 'us-east-1',
};

export type AppConfig = typeof config;
