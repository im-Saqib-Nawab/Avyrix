import { Router } from 'express';
import { authMiddleware } from '@/middleware/auth.middleware';
import { generationLimiter } from '@/middleware/rateLimit.middleware';
import { validate, validateParams, validateQuery } from '@/middleware/validate.middleware';
import {
  enhancePromptSchema,
  generationIdParamSchema,
  imageGenerationSchema,
  listGenerationsQuerySchema,
  videoGenerationSchema,
} from './generations.schema';
import * as generationsController from './generations.controller';

const router = Router();

router.use(authMiddleware);

router.post(
  '/image',
  generationLimiter,
  validate(imageGenerationSchema),
  generationsController.createImage,
);

router.post(
  '/video',
  generationLimiter,
  validate(videoGenerationSchema),
  generationsController.createVideo,
);

router.get(
  '/summary',
  generationsController.summary,
);

router.get(
  '/',
  validateQuery(listGenerationsQuerySchema),
  generationsController.list,
);

router.post(
  '/enhance-prompt',
  validate(enhancePromptSchema),
  generationsController.enhancePrompt,
);

router.get(
  '/:id',
  validateParams(generationIdParamSchema),
  generationsController.getById,
);

router.delete(
  '/:id',
  validateParams(generationIdParamSchema),
  generationsController.remove,
);

router.post(
  '/:id/reuse',
  validateParams(generationIdParamSchema),
  generationsController.reuse,
);

export default router;
