import { Router } from 'express';
import { ReportsController } from './reports.controller';
import { requireAuth, requireRole } from '../../shared/middlewares/auth.middleware';
import { validate } from '../../shared/middlewares/validate.middleware';
import { createReportSchema, updateReportStatusSchema } from './reports.validators';
import { UserRole } from '@prisma/client';

const router = Router();
const controller = new ReportsController();

router.post('/', requireAuth(), validate(createReportSchema), controller.createReport);
router.get('/', requireAuth(), requireRole([UserRole.ADMIN, UserRole.MODERATOR]), controller.listReports);
router.patch('/:id/status', requireAuth(), requireRole([UserRole.ADMIN, UserRole.MODERATOR]), validate(updateReportStatusSchema), controller.updateStatus);

export default router;
