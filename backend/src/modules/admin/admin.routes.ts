import { Router } from 'express';
import { authMiddleware } from '@/middleware/auth.middleware';
import { adminMiddleware } from '@/middleware/admin.middleware';
import { validate, validateParams, validateQuery } from '@/middleware/validate.middleware';
import {
  adjustCreditsSchema,
  listGenerationsQuerySchema,
  listLogsQuerySchema,
  listUsersQuerySchema,
  userIdParamSchema,
} from './admin.schema';
import * as adminController from './admin.controller';

const router = Router();

router.use(authMiddleware, adminMiddleware);

router.get('/stats', adminController.getStats);

router.get('/users', validateQuery(listUsersQuerySchema), adminController.listUsers);

router.get('/users/:id', validateParams(userIdParamSchema), adminController.getUser);

router.post(
  '/users/:id/credits',
  validateParams(userIdParamSchema),
  validate(adjustCreditsSchema),
  adminController.adjustCredits,
);

router.get(
  '/generations',
  validateQuery(listGenerationsQuerySchema),
  adminController.listGenerations,
);

router.get('/logs', validateQuery(listLogsQuerySchema), adminController.listLogs);

router.get('/api-health', adminController.getApiHealth);

router.post('/api-health/refresh', adminController.refreshApiHealth);

export default router;
