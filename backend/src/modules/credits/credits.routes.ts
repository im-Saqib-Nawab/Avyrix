import { Router } from 'express';
import { authMiddleware } from '@/middleware/auth.middleware';
import { validateQuery } from '@/middleware/validate.middleware';
import { listTransactionsQuerySchema } from './credits.schema';
import * as creditsController from './credits.controller';

const router = Router();

router.use(authMiddleware);

router.get('/balance', creditsController.getBalance);

router.get(
  '/transactions',
  validateQuery(listTransactionsQuerySchema),
  creditsController.listTransactions,
);

export default router;
