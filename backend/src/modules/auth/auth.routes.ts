import { Router } from 'express';
import { authMiddleware } from '@/middleware/auth.middleware';
import { authLimiter } from '@/middleware/rateLimit.middleware';
import { validate } from '@/middleware/validate.middleware';
import {
  forgotPasswordSchema,
  loginSchema,
  registerSchema,
  resetPasswordSchema,
  verifyEmailSchema,
} from './auth.schema';
import * as authController from './auth.controller';

const router = Router();

router.post(
  '/register',
  authLimiter,
  validate(registerSchema),
  authController.register,
);

router.post('/login', authLimiter, validate(loginSchema), authController.login);

router.post('/refresh', authController.refresh);

router.post('/logout', authMiddleware, authController.logout);

router.get('/me', authMiddleware, authController.me);

router.get('/verify-email/:token', authController.verifyEmail);

router.post(
  '/verify-email',
  validate(verifyEmailSchema),
  authController.verifyEmailPost,
);

router.post('/resend-verification', authMiddleware, authController.resendVerification);

router.post(
  '/forgot-password',
  authLimiter,
  validate(forgotPasswordSchema),
  authController.forgotPassword,
);

router.post(
  '/reset-password',
  authLimiter,
  validate(resetPasswordSchema),
  authController.resetPassword,
);

export default router;
