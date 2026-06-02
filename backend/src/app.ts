import 'express-async-errors';
import express from 'express';
import path from 'path';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import cookieParser from 'cookie-parser';
import { config } from '@/config';
import { requestIdMiddleware } from '@/middleware/requestId.middleware';
import { generalLimiter } from '@/middleware/rateLimit.middleware';
import { errorMiddleware } from '@/middleware/error.middleware';
import { stripeWebhookHandler } from '@/modules/billing/stripe.webhook';
import authRoutes from '@/modules/auth/auth.routes';
import generationsRoutes from '@/modules/generations/generations.routes';
import creditsRoutes from '@/modules/credits/credits.routes';
import usersRoutes from '@/modules/users/users.routes';
import billingRoutes from '@/modules/billing/billing.routes';
import adminRoutes from '@/modules/admin/admin.routes';
import apiHealthRoutes from '@/modules/api-health/apiHealth.routes';

export const app = express();

app.use(requestIdMiddleware);
app.use(helmet());
app.use(
  cors({
    origin: config.FRONTEND_URL.replace(/\/$/, ''),
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  }),
);

app.use('/uploads', express.static(path.join(process.cwd(), 'public', 'uploads')));
app.use(compression());

app.post(
  '/api/billing/webhook',
  express.raw({ type: 'application/json' }),
  stripeWebhookHandler,
);

app.use(express.json({ limit: '10mb' }));
app.use(cookieParser());

app.get('/health', (_req, res) => {
  res.json({ success: true, data: { status: 'ok' } });
});

app.use('/api', generalLimiter);

app.use('/api/auth', authRoutes);
app.use('/api/generations', generationsRoutes);
app.use('/api/credits', creditsRoutes);
app.use('/api/users', usersRoutes);
app.use('/api/billing', billingRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/api-health', apiHealthRoutes);

app.use(errorMiddleware);
