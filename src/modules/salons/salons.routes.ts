import { Router } from 'express';
import { SalonsController } from './salons.controller';
import { ReviewsController } from '../reviews/reviews.controller';
import { requireAuth, requireRole } from '../../shared/middlewares/auth.middleware';
import { UserRole } from '@prisma/client';
import { validate } from '../../shared/middlewares/validate.middleware';
import { createSalonSchema, updateSalonSchema, assignServicesSchema, linkArtistSchema } from './salons.validators';

const router = Router();
const controller = new SalonsController();
const reviewsController = new ReviewsController();

router.get('/', controller.getSalons);
router.get('/:slug', controller.getSalon);
router.get('/:slug/reviews', reviewsController.getSalonReviews);

router.post(
  '/',
  requireAuth(),
  requireRole([UserRole.SALON, UserRole.ADMIN]),
  validate(createSalonSchema),
  controller.createSalon
);

router.patch(
  '/:id',
  requireAuth(),
  validate(updateSalonSchema),
  controller.updateSalon
);

router.delete(
  '/:id',
  requireAuth(),
  controller.deleteSalon
);

router.post(
  '/:id/services',
  requireAuth(),
  validate(assignServicesSchema),
  controller.assignServices
);

router.delete(
  '/:id/services/:serviceId',
  requireAuth(),
  controller.removeService
);

router.post(
  '/:id/avatar',
  requireAuth(),
  controller.setAvatar
);

router.post(
  '/:id/cover',
  requireAuth(),
  controller.setCover
);

router.post(
  '/:id/gallery',
  requireAuth(),
  controller.addGallery
);

router.post(
  '/:id/artists',
  requireAuth(),
  validate(linkArtistSchema),
  controller.linkArtist
);

router.delete(
  '/:id/artists/:artistId',
  requireAuth(),
  controller.unlinkArtist
);

export default router;
