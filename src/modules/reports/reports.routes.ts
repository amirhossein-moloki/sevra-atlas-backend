import { Router } from 'express';
import { ReportsController } from './reports.controller';
import { requireAuth, requireStaff } from '../../shared/middlewares/auth.middleware';
import { validate } from '../../shared/middlewares/validate.middleware';
import { createReportSchema, updateReportStatusSchema } from './reports.validators';

const router = Router();
const controller = new ReportsController();

router.post('/', requireAuth(), validate(createReportSchema), controller.createReport);
router.get('/', requireAuth(), requireStaff(), controller.listReports);
router.patch('/:id/status', requireAuth(), requireStaff(), validate(updateReportStatusSchema), controller.updateStatus);

export default router;
