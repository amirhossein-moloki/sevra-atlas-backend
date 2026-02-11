import { Router } from 'express';
import { ArtistsController } from './artists.controller';
import { requireAuth, requireAdmin } from '../../shared/middlewares/auth.middleware';

const router = Router();
const controller = new ArtistsController();

router.get('/', controller.listSpecialties);

router.post(
  '/',
  requireAuth(),
  requireAdmin(),
  controller.createSpecialty
);

router.patch(
  '/:id',
  requireAuth(),
  requireAdmin(),
  controller.updateSpecialty
);

router.delete(
  '/:id',
  requireAuth(),
  requireAdmin(),
  controller.deleteSpecialty
);

export default router;
