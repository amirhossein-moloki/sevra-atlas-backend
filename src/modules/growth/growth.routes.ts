import { Router } from 'express';
import { GrowthController } from './growth.controller';
import { requireAuth } from '../../shared/middlewares/auth.middleware';

const router = Router();
const controller = new GrowthController();

router.post('/invites', requireAuth, controller.createInvite);
router.get('/stats', requireAuth, controller.getMyStats);

export default router;
