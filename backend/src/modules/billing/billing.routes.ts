import { Router } from 'express';
import { authMiddleware } from '@/middleware/auth.middleware';
import { validate } from '@/middleware/validate.middleware';
import { checkoutSchema } from './billing.schema';
import * as billingController from './billing.controller';

const router = Router();

router.get('/plans', billingController.getPlans);

router.post('/checkout', authMiddleware, validate(checkoutSchema), billingController.createCheckout);

router.get('/history', authMiddleware, billingController.getHistory);

export default router;
