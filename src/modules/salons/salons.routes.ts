import { Router } from 'express';
import { SalonsController } from './salons.controller';
import { authMiddleware, requireRole } from '../../shared/middlewares/auth.middleware';
import { UserRole } from '@prisma/client';
import { validate } from '../../shared/middlewares/validate.middleware';
import { createSalonSchema, updateSalonSchema } from './salons.validators';

const router = Router();
const controller = new SalonsController();

router.get('/', controller.getSalons);
router.get('/:slug', controller.getSalon);

router.post(
  '/',
  authMiddleware,
  requireRole([UserRole.SALON, UserRole.ADMIN]),
  validate(createSalonSchema),
  controller.createSalon
);

router.patch(
  '/:id',
  authMiddleware,
  validate(updateSalonSchema),
  controller.updateSalon
);

export default router;
