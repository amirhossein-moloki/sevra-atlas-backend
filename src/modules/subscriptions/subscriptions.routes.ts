import { Router } from 'express';
import { SubscriptionsController } from './subscriptions.controller';
import { requireAuth, requireRole } from '../../shared/middlewares/auth.middleware';
import { UserRole } from '@prisma/client';

const router = Router();
const controller = new SubscriptionsController();

// Public routes
router.get('/plans', controller.getPlans);

// Admin routes
router.post('/assign', requireAuth, requireRole([UserRole.ADMIN]), controller.assignPlan);
router.post('/suspend', requireAuth, requireRole([UserRole.ADMIN]), controller.suspendSubscription);
router.post('/override-score', requireAuth, requireRole([UserRole.ADMIN]), controller.overrideScore);
router.get('/stats', requireAuth, requireRole([UserRole.ADMIN]), controller.getStats);
router.get('/analytics', requireAuth, requireRole([UserRole.ADMIN]), controller.getAnalytics);
router.get('/export-billing', requireAuth, requireRole([UserRole.ADMIN]), controller.exportBilling);
router.post('/check-expirations', requireAuth, requireRole([UserRole.ADMIN]), controller.runExpirationCheck);

export default router;
