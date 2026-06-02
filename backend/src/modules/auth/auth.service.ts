import crypto from 'crypto';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';
import type { Response } from 'express';
import { TransactionType } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { signAccessToken, signRefreshToken, verifyRefreshToken } from '@/lib/jwt';
import { AppError } from '@/lib/appError';
import { config } from '@/config';
import { sendPasswordResetEmail, sendVerificationEmail } from '@/services/email.service';
import { logger } from '@/services/logger.service';
import {
  REFRESH_COOKIE_MAX_AGE_MS,
  REFRESH_COOKIE_NAME,
  toAuthUser,
} from './auth.utils';
import type {
  ForgotPasswordInput,
  LoginInput,
  RegisterInput,
  ResetPasswordInput,
} from './auth.schema';

const BCRYPT_ROUNDS = 12;
const STARTER_CREDITS = 100;
const RESET_TOKEN_TTL_MS = 30 * 60 * 1000;
const VERIFICATION_TOKEN_TTL_MS = 24 * 60 * 60 * 1000;
const MAX_VERIFICATION_RESENDS_PER_HOUR = 3;

const verificationResendLog = new Map<string, number[]>();

function createSecureToken(): string {
  return crypto.randomBytes(32).toString('hex');
}

function assertVerificationResendAllowed(userId: string): void {
  const now = Date.now();
  const windowStart = now - 60 * 60 * 1000;
  const timestamps = (verificationResendLog.get(userId) ?? []).filter((t) => t > windowStart);
  if (timestamps.length >= MAX_VERIFICATION_RESENDS_PER_HOUR) {
    throw new AppError(
      429,
      'RATE_LIMIT_EXCEEDED',
      'Too many verification emails sent. Please try again in an hour.',
    );
  }
  timestamps.push(now);
  verificationResendLog.set(userId, timestamps);
}

function hashResetToken(token: string): string {
  return crypto.createHash('sha256').update(token).digest('hex');
}

function setRefreshCookie(res: Response, refreshToken: string): void {
  res.cookie(REFRESH_COOKIE_NAME, refreshToken, {
    httpOnly: true,
    secure: config.NODE_ENV === 'production',
    sameSite: config.NODE_ENV === 'production' ? 'strict' : 'lax',
    maxAge: REFRESH_COOKIE_MAX_AGE_MS,
  });
}

function clearRefreshCookie(res: Response): void {
  res.clearCookie(REFRESH_COOKIE_NAME, {
    httpOnly: true,
    secure: config.NODE_ENV === 'production',
    sameSite: config.NODE_ENV === 'production' ? 'strict' : 'lax',
  });
}

async function hashRefreshToken(token: string): Promise<string> {
  return bcrypt.hash(token, BCRYPT_ROUNDS);
}

async function storeRefreshTokenHash(userId: string, refreshToken: string): Promise<void> {
  const refreshTokenHash = await hashRefreshToken(refreshToken);
  await prisma.user.update({
    where: { id: userId },
    data: { refresh_token_hash: refreshTokenHash },
  });
}

async function issueTokenPair(
  user: { id: string; email: string; role: string },
  res: Response,
): Promise<{ accessToken: string; refreshToken: string }> {
  const payload = { userId: user.id, email: user.email, role: user.role };
  const accessToken = signAccessToken(payload);
  const refreshToken = signRefreshToken(payload);

  await storeRefreshTokenHash(user.id, refreshToken);
  setRefreshCookie(res, refreshToken);

  return { accessToken, refreshToken };
}

export async function register(input: RegisterInput, res: Response) {
  const email = input.email.trim().toLowerCase();

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    throw new AppError(409, 'CONFLICT', 'An account with this email already exists.');
  }

  const passwordHash = await bcrypt.hash(input.password, BCRYPT_ROUNDS);
  const verificationToken = createSecureToken();
  const verificationExpiresAt = new Date(Date.now() + VERIFICATION_TOKEN_TTL_MS);

  const user = await prisma.$transaction(async (tx) => {
    const created = await tx.user.create({
      data: {
        full_name: input.full_name.trim(),
        email,
        password_hash: passwordHash,
        role: 'user',
        credit_balance: STARTER_CREDITS,
        subscription_status: 'free',
        is_verified: false,
        verification_token: verificationToken,
        verification_token_expires_at: verificationExpiresAt,
      },
    });

    await tx.creditTransaction.create({
      data: {
        user_id: created.id,
        type: TransactionType.topup,
        amount: STARTER_CREDITS,
        balance_after: STARTER_CREDITS,
        description: 'Welcome bonus credits',
      },
    });

    return created;
  });

  void sendVerificationEmail(email, verificationToken).catch((error) => {
    logger.error('Failed to send verification email', {
      user_id: user.id,
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  });

  const { accessToken } = await issueTokenPair(user, res);

  return {
    user: toAuthUser(user),
    accessToken,
  };
}

export async function login(input: LoginInput, res: Response) {
  const email = input.email.trim().toLowerCase();

  const user = await prisma.user.findFirst({
    where: { email: { equals: email, mode: 'insensitive' } },
  });

  if (!user) {
    throw new AppError(
      401,
      'UNAUTHORIZED',
      'Invalid credentials. Please check your email and password.',
    );
  }

  const passwordValid = await bcrypt.compare(input.password, user.password_hash);
  if (!passwordValid) {
    throw new AppError(
      401,
      'UNAUTHORIZED',
      'Invalid credentials. Please check your email and password.',
    );
  }

  const { accessToken } = await issueTokenPair(user, res);

  return {
    user: toAuthUser(user),
    accessToken,
  };
}

export async function refreshSession(refreshToken: string | undefined, res: Response) {
  if (!refreshToken) {
    throw new AppError(401, 'UNAUTHORIZED', 'Authentication required. Please log in.');
  }

  let payload;
  try {
    payload = verifyRefreshToken(refreshToken);
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      clearRefreshCookie(res);
      throw new AppError(403, 'TOKEN_EXPIRED', 'Your session has expired. Please log in again.');
    }
    throw new AppError(401, 'UNAUTHORIZED', 'Authentication required. Please log in.');
  }

  const user = await prisma.user.findUnique({ where: { id: payload.userId } });
  if (!user || !user.refresh_token_hash) {
    throw new AppError(401, 'UNAUTHORIZED', 'Authentication required. Please log in.');
  }

  const tokenMatches = await bcrypt.compare(refreshToken, user.refresh_token_hash);
  if (!tokenMatches) {
    await prisma.user.update({
      where: { id: user.id },
      data: { refresh_token_hash: null },
    });
    clearRefreshCookie(res);
    throw new AppError(
      401,
      'UNAUTHORIZED',
      'Session invalidated due to suspicious activity. Please log in again.',
    );
  }

  const { accessToken } = await issueTokenPair(user, res);

  return { accessToken };
}

export async function logout(userId: string, res: Response) {
  await prisma.user.update({
    where: { id: userId },
    data: { refresh_token_hash: null },
  });
  clearRefreshCookie(res);
  return { message: 'Logged out successfully.' };
}

export async function getMe(userId: string) {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) {
    throw new AppError(401, 'UNAUTHORIZED', 'Authentication required. Please log in.');
  }
  return { user: toAuthUser(user) };
}

export async function verifyEmail(rawToken: string) {
  const token = decodeURIComponent(rawToken).trim();

  if (!token) {
    throw new AppError(400, 'VALIDATION_ERROR', 'Invalid verification link.');
  }

  const user = await prisma.user.findFirst({
    where: { verification_token: token },
  });

  if (!user) {
    throw new AppError(400, 'VALIDATION_ERROR', 'Invalid verification link.');
  }

  if (user.is_verified) {
    return { message: 'Email is already verified.', user: toAuthUser(user) };
  }

  if (
    user.verification_token_expires_at &&
    user.verification_token_expires_at.getTime() < Date.now()
  ) {
    throw new AppError(
      400,
      'VALIDATION_ERROR',
      'This verification link has expired. Please request a new one.',
    );
  }

  const updated = await prisma.user.update({
    where: { id: user.id },
    data: {
      is_verified: true,
      verification_token_expires_at: null,
    },
  });

  return { message: 'Email verified successfully.', user: toAuthUser(updated) };
}

export async function resendVerification(userId: string) {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) {
    throw new AppError(404, 'NOT_FOUND', 'User not found.');
  }

  if (user.is_verified) {
    return { message: 'Email is already verified.' };
  }

  assertVerificationResendAllowed(userId);

  const verificationToken = createSecureToken();
  const verificationExpiresAt = new Date(Date.now() + VERIFICATION_TOKEN_TTL_MS);

  await prisma.user.update({
    where: { id: userId },
    data: {
      verification_token: verificationToken,
      verification_token_expires_at: verificationExpiresAt,
    },
  });

  try {
    await sendVerificationEmail(user.email, verificationToken);
  } catch (error) {
    logger.error('Failed to resend verification email', {
      user_id: userId,
      message: error instanceof Error ? error.message : 'Unknown error',
    });
    throw new AppError(
      503,
      'SERVICE_UNAVAILABLE',
      'Could not send verification email. Please try again in a few minutes.',
    );
  }

  return { message: 'Verification email sent.' };
}

export async function forgotPassword(input: ForgotPasswordInput) {
  const email = input.email.trim().toLowerCase();
  const user = await prisma.user.findFirst({
    where: { email: { equals: email, mode: 'insensitive' } },
  });

  if (user) {
    const resetToken = uuidv4();
    const tokenHash = hashResetToken(resetToken);
    const expiresAt = new Date(Date.now() + RESET_TOKEN_TTL_MS);

    await prisma.user.update({
      where: { id: user.id },
      data: {
        password_reset_token: tokenHash,
        reset_token_expires_at: expiresAt,
      },
    });

    void sendPasswordResetEmail(user.email, resetToken).catch((error) => {
      logger.error('Failed to send password reset email', {
        user_id: user.id,
        message: error instanceof Error ? error.message : 'Unknown error',
      });
    });
  }

  return {
    message: 'If an account with that email exists, a reset link has been sent.',
  };
}

export async function resetPassword(input: ResetPasswordInput) {
  const tokenHash = hashResetToken(input.token);

  const user = await prisma.user.findFirst({
    where: {
      password_reset_token: tokenHash,
      reset_token_expires_at: { gt: new Date() },
    },
  });

  if (!user) {
    throw new AppError(
      400,
      'VALIDATION_ERROR',
      'This reset link is invalid or has expired. Please request a new one.',
    );
  }

  const passwordHash = await bcrypt.hash(input.password, BCRYPT_ROUNDS);

  await prisma.user.update({
    where: { id: user.id },
    data: {
      password_hash: passwordHash,
      password_reset_token: null,
      reset_token_expires_at: null,
      refresh_token_hash: null,
    },
  });

  return { message: 'Password reset successfully. Please log in.' };
}
