import { Router } from 'express';
import { ReportsController } from './reports.controller';
import { requireAuth, requireStaff } from '../../shared/middlewares/auth.middleware';
import { validate } from '../../shared/middlewares/validate.middleware';
import { createReportSchema, updateReportStatusSchema } from './reports.validators';
import { registry, z, withApiSuccess } from '../../shared/openapi/registry';
import { ReportSchema } from '../../shared/openapi/schemas';

const router = Router();
const controller = new ReportsController();

const tag = 'Reports';

registry.registerPath({
  method: 'post',
  path: '/reports',
  summary: 'Create a report',
  tags: [tag],
  security: [{ bearerAuth: [] }],
  request: {
    body: { content: { 'application/json': { schema: createReportSchema.shape.body } } }
  },
  responses: {
    201: {
      description: 'Report created',
      content: { 'application/json': { schema: withApiSuccess(ReportSchema) } }
    }
  }
});
router.post('/', requireAuth(), validate(createReportSchema), controller.createReport);

registry.registerPath({
  method: 'get',
  path: '/reports',
  summary: 'List reports (Staff)',
  tags: [tag],
  security: [{ bearerAuth: [] }],
  responses: {
    200: {
      description: 'List of reports',
      content: { 'application/json': { schema: withApiSuccess(z.array(ReportSchema)) } }
    }
  }
});
router.get('/', requireAuth(), requireStaff(), controller.listReports);

registry.registerPath({
  method: 'patch',
  path: '/reports/{id}/status',
  summary: 'Update report status (Staff)',
  tags: [tag],
  security: [{ bearerAuth: [] }],
  parameters: [{ name: 'id', in: 'path', schema: { type: 'string' }, required: true }],
  request: {
    body: { content: { 'application/json': { schema: updateReportStatusSchema.shape.body } } }
  },
  responses: {
    200: {
      description: 'Status updated',
      content: { 'application/json': { schema: withApiSuccess(ReportSchema) } }
    }
  }
});
router.patch('/:id/status', requireAuth(), requireStaff(), validate(updateReportStatusSchema), controller.updateStatus);

export default router;
