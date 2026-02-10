import { Router } from 'express';
import { ArtistsController } from './artists.controller';
import { ReviewsController } from '../reviews/reviews.controller';
import { requireAuth, requireRole } from '../../shared/middlewares/auth.middleware';
import { UserRole } from '@prisma/client';
import { validate } from '../../shared/middlewares/validate.middleware';
import { createArtistSchema, updateArtistSchema, certificationSchema, assignSpecialtiesSchema } from './artists.validators';

const router = Router();
const controller = new ArtistsController();
const reviewsController = new ReviewsController();

router.get('/', controller.getArtists);
router.get('/specialties', controller.listSpecialties);
router.get('/:slug', controller.getArtist);
router.get('/:slug/reviews', reviewsController.getArtistReviews);

router.post(
  '/',
  requireAuth(),
  requireRole([UserRole.ARTIST, UserRole.ADMIN]),
  validate(createArtistSchema),
  controller.createArtist
);

router.patch(
  '/:id',
  requireAuth(),
  validate(updateArtistSchema),
  controller.updateArtist
);

router.delete(
  '/:id',
  requireAuth(),
  controller.deleteArtist
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
  '/:id/certifications',
  requireAuth(),
  validate(certificationSchema),
  controller.addCertification
);

router.patch(
  '/:id/certifications/:certId',
  requireAuth(),
  validate(certificationSchema.partial()),
  controller.updateCertification
);

router.delete(
  '/:id/certifications/:certId',
  requireAuth(),
  controller.deleteCertification
);

router.patch(
  '/:id/certifications/:certId/verify',
  requireAuth(),
  requireRole([UserRole.ADMIN, UserRole.MODERATOR]),
  controller.verifyCertification
);

router.post(
  '/:id/specialties',
  requireAuth(),
  validate(assignSpecialtiesSchema),
  controller.assignSpecialties
);

export default router;
