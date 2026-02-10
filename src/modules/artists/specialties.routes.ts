import { Router } from 'express';
import { ArtistsController } from './artists.controller';
import { requireAuth, requireRole } from '../../shared/middlewares/auth.middleware';
import { UserRole } from '@prisma/client';

const router = Router();
const controller = new ArtistsController();

router.get('/', controller.listSpecialties);

router.post(
  '/',
  requireAuth(),
  requireRole([UserRole.ADMIN]),
  controller.createSpecialty
);

router.patch(
  '/:id',
  requireAuth(),
  requireRole([UserRole.ADMIN]),
  controller.updateSpecialty
);

router.delete(
  '/:id',
  requireAuth(),
  requireRole([UserRole.ADMIN]),
  controller.deleteSpecialty
);

export default router;
