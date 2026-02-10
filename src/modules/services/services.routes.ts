import { Router } from 'express';
import { ServicesController } from './services.controller';
import { requireAuth, requireRole } from '../../shared/middlewares/auth.middleware';
import { UserRole } from '@prisma/client';
import { validate } from '../../shared/middlewares/validate.middleware';
import { createCategorySchema, createServiceSchema, updateServiceSchema } from './services.validators';

const router = Router();
const controller = new ServicesController();

router.get('/', controller.listCategories);
router.get('/:slug', controller.getService);

router.post(
  '/categories',
  requireAuth(),
  requireRole([UserRole.ADMIN]),
  validate(createCategorySchema),
  controller.createCategory
);

router.post(
  '/',
  requireAuth(),
  requireRole([UserRole.ADMIN]),
  validate(createServiceSchema),
  controller.createService
);

router.patch(
  '/:id',
  requireAuth(),
  requireRole([UserRole.ADMIN]),
  validate(updateServiceSchema),
  controller.updateService
);

router.delete(
  '/:id',
  requireAuth(),
  requireRole([UserRole.ADMIN]),
  controller.deleteService
);

export default router;
