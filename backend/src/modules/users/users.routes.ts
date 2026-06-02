import { Router } from 'express';
import { authMiddleware } from '@/middleware/auth.middleware';
import { validate } from '@/middleware/validate.middleware';
import {
  changePasswordSchema,
  createProjectSchema,
  updateProfileSchema,
} from './users.schema';
import * as usersController from './users.controller';

const router = Router();

router.use(authMiddleware);

router.get('/me', usersController.getMe);

router.patch('/me', validate(updateProfileSchema), usersController.updateMe);

router.patch('/me/password', validate(changePasswordSchema), usersController.changePassword);

router.get('/me/projects', usersController.listProjects);

router.post('/me/projects', validate(createProjectSchema), usersController.createProject);

export default router;
