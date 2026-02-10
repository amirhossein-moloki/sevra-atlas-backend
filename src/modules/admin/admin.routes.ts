import { Router } from 'express';
import { AdminController } from './admin.controller';
import { requireAuth, requireRole } from '../../shared/middlewares/auth.middleware';
import { validate } from '../../shared/middlewares/validate.middleware';
import { statsQuerySchema } from './admin.validators';
import { UserRole } from '@prisma/client';

const router = Router();
const controller = new AdminController();

router.get('/dashboard', requireAuth(), requireRole([UserRole.ADMIN]), controller.getDashboard);
router.get('/stats', requireAuth(), requireRole([UserRole.ADMIN]), validate(statsQuerySchema), controller.getStats);

export default router;
