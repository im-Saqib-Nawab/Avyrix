import { Router } from 'express';
import * as apiHealthController from './apiHealth.controller';

const router = Router();

router.get('/', apiHealthController.getPublicHealth);

export default router;
