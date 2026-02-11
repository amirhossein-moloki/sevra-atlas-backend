import { Router } from 'express';
import { ArtistsController } from './artists.controller';
import { ReviewsController } from '../reviews/reviews.controller';
import { requireAuth, requireRole, requireStaff } from '../../shared/middlewares/auth.middleware';
import { UserRole } from '@prisma/client';
import { validate } from '../../shared/middlewares/validate.middleware';
import { createArtistSchema, updateArtistSchema, certificationSchema, assignSpecialtiesSchema } from './artists.validators';
import { registry, z, withApiSuccess } from '../../shared/openapi/registry';
import { ArtistSchema, SpecialtySchema, ReviewSchema, MediaSchema, ArtistCertificationSchema } from '../../shared/openapi/schemas';

const router = Router();
const controller = new ArtistsController();
const reviewsController = new ReviewsController();

const tag = 'Artists';

registry.registerPath({
  method: 'get',
  path: '/artists',
  summary: 'List all artists',
  tags: [tag],
  responses: {
    200: {
      description: 'List of artists',
      content: { 'application/json': { schema: withApiSuccess(z.array(ArtistSchema)) } }
    }
  }
});
router.get('/', controller.getArtists);

registry.registerPath({
  method: 'get',
  path: '/artists/specialties',
  summary: 'List artist specialties',
  tags: [tag],
  responses: {
    200: {
      description: 'List of specialties',
      content: { 'application/json': { schema: withApiSuccess(z.array(SpecialtySchema)) } }
    }
  }
});
router.get('/specialties', controller.listSpecialties);

registry.registerPath({
  method: 'get',
  path: '/artists/{slug}',
  summary: 'Get artist by slug',
  tags: [tag],
  parameters: [{ name: 'slug', in: 'path', schema: { type: 'string' }, required: true }],
  responses: {
    200: {
      description: 'Artist details',
      content: { 'application/json': { schema: withApiSuccess(ArtistSchema) } }
    }
  }
});
router.get('/:slug', controller.getArtist);

registry.registerPath({
  method: 'get',
  path: '/artists/{slug}/reviews',
  summary: 'Get artist reviews',
  tags: [tag],
  parameters: [{ name: 'slug', in: 'path', schema: { type: 'string' }, required: true }],
  responses: {
    200: {
      description: 'List of reviews',
      content: { 'application/json': { schema: withApiSuccess(z.array(ReviewSchema)) } }
    }
  }
});
router.get('/:slug/reviews', reviewsController.getArtistReviews);

registry.registerPath({
  method: 'post',
  path: '/artists',
  summary: 'Create an artist',
  tags: [tag],
  security: [{ bearerAuth: [] }],
  request: {
    body: { content: { 'application/json': { schema: createArtistSchema.shape.body } } }
  },
  responses: {
    201: {
      description: 'Artist created',
      content: { 'application/json': { schema: withApiSuccess(ArtistSchema) } }
    }
  }
});
router.post(
  '/',
  requireAuth(),
  requireRole([UserRole.ARTIST, UserRole.ADMIN]),
  validate(createArtistSchema),
  controller.createArtist
);

registry.registerPath({
  method: 'patch',
  path: '/artists/{id}',
  summary: 'Update an artist',
  tags: [tag],
  security: [{ bearerAuth: [] }],
  parameters: [{ name: 'id', in: 'path', schema: { type: 'string' }, required: true }],
  request: {
    body: { content: { 'application/json': { schema: updateArtistSchema.shape.body } } }
  },
  responses: {
    200: {
      description: 'Artist updated',
      content: { 'application/json': { schema: withApiSuccess(ArtistSchema) } }
    }
  }
});
router.patch(
  '/:id',
  requireAuth(),
  validate(updateArtistSchema),
  controller.updateArtist
);

registry.registerPath({
  method: 'delete',
  path: '/artists/{id}',
  summary: 'Delete an artist',
  tags: [tag],
  security: [{ bearerAuth: [] }],
  parameters: [{ name: 'id', in: 'path', schema: { type: 'string' }, required: true }],
  responses: {
    200: {
      description: 'Artist deleted',
      content: { 'application/json': { schema: withApiSuccess(z.object({ ok: z.boolean() })) } }
    }
  }
});
router.delete(
  '/:id',
  requireAuth(),
  controller.deleteArtist
);

registry.registerPath({
  method: 'post',
  path: '/artists/{id}/avatar',
  summary: 'Set artist avatar',
  tags: [tag],
  security: [{ bearerAuth: [] }],
  parameters: [{ name: 'id', in: 'path', schema: { type: 'string' }, required: true }],
  request: {
    body: { content: { 'application/json': { schema: z.object({ mediaId: z.string() }) } } }
  },
  responses: {
    200: {
      description: 'Avatar updated',
      content: { 'application/json': { schema: withApiSuccess(MediaSchema) } }
    }
  }
});
router.post(
  '/:id/avatar',
  requireAuth(),
  controller.setAvatar
);

registry.registerPath({
  method: 'post',
  path: '/artists/{id}/cover',
  summary: 'Set artist cover',
  tags: [tag],
  security: [{ bearerAuth: [] }],
  parameters: [{ name: 'id', in: 'path', schema: { type: 'string' }, required: true }],
  request: {
    body: { content: { 'application/json': { schema: z.object({ mediaId: z.string() }) } } }
  },
  responses: {
    200: {
      description: 'Cover updated',
      content: { 'application/json': { schema: withApiSuccess(MediaSchema) } }
    }
  }
});
router.post(
  '/:id/cover',
  requireAuth(),
  controller.setCover
);

registry.registerPath({
  method: 'post',
  path: '/artists/{id}/gallery',
  summary: 'Add to artist gallery',
  tags: [tag],
  security: [{ bearerAuth: [] }],
  parameters: [{ name: 'id', in: 'path', schema: { type: 'string' }, required: true }],
  request: {
    body: { content: { 'application/json': { schema: z.object({ mediaIds: z.array(z.string()) }) } } }
  },
  responses: {
    200: {
      description: 'Gallery updated',
      content: { 'application/json': { schema: withApiSuccess(MediaSchema) } }
    }
  }
});
router.post(
  '/:id/gallery',
  requireAuth(),
  controller.addGallery
);

registry.registerPath({
  method: 'post',
  path: '/artists/{id}/certifications',
  summary: 'Add certification to artist',
  tags: [tag],
  security: [{ bearerAuth: [] }],
  parameters: [{ name: 'id', in: 'path', schema: { type: 'string' }, required: true }],
  request: {
    body: { content: { 'application/json': { schema: certificationSchema.shape.body } } }
  },
  responses: {
    200: {
      description: 'Certification added',
      content: { 'application/json': { schema: withApiSuccess(ArtistCertificationSchema) } }
    }
  }
});
router.post(
  '/:id/certifications',
  requireAuth(),
  validate(certificationSchema),
  controller.addCertification
);

registry.registerPath({
  method: 'patch',
  path: '/artists/{id}/certifications/{certId}',
  summary: 'Update artist certification',
  tags: [tag],
  security: [{ bearerAuth: [] }],
  parameters: [
    { name: 'id', in: 'path', schema: { type: 'string' }, required: true },
    { name: 'certId', in: 'path', schema: { type: 'string' }, required: true }
  ],
  request: {
    body: { content: { 'application/json': { schema: certificationSchema.partial().shape.body } } }
  },
  responses: {
    200: {
      description: 'Certification updated',
      content: { 'application/json': { schema: withApiSuccess(ArtistCertificationSchema) } }
    }
  }
});
router.patch(
  '/:id/certifications/:certId',
  requireAuth(),
  validate(certificationSchema.partial()),
  controller.updateCertification
);

registry.registerPath({
  method: 'delete',
  path: '/artists/{id}/certifications/{certId}',
  summary: 'Delete artist certification',
  tags: [tag],
  security: [{ bearerAuth: [] }],
  parameters: [
    { name: 'id', in: 'path', schema: { type: 'string' }, required: true },
    { name: 'certId', in: 'path', schema: { type: 'string' }, required: true }
  ],
  responses: {
    200: {
      description: 'Certification deleted',
      content: { 'application/json': { schema: withApiSuccess(z.object({ ok: z.boolean() })) } }
    }
  }
});
router.delete(
  '/:id/certifications/:certId',
  requireAuth(),
  controller.deleteCertification
);

registry.registerPath({
  method: 'patch',
  path: '/artists/{id}/certifications/{certId}/verify',
  summary: 'Verify artist certification (Staff)',
  tags: [tag],
  security: [{ bearerAuth: [] }],
  parameters: [
    { name: 'id', in: 'path', schema: { type: 'string' }, required: true },
    { name: 'certId', in: 'path', schema: { type: 'string' }, required: true }
  ],
  responses: {
    200: {
      description: 'Certification verified',
      content: { 'application/json': { schema: withApiSuccess(z.object({ ok: z.boolean() })) } }
    }
  }
});
router.patch(
  '/:id/certifications/:certId/verify',
  requireAuth(),
  requireStaff(),
  controller.verifyCertification
);

registry.registerPath({
  method: 'post',
  path: '/artists/{id}/specialties',
  summary: 'Assign specialties to artist',
  tags: [tag],
  security: [{ bearerAuth: [] }],
  parameters: [{ name: 'id', in: 'path', schema: { type: 'string' }, required: true }],
  request: {
    body: { content: { 'application/json': { schema: assignSpecialtiesSchema.shape.body } } }
  },
  responses: {
    200: {
      description: 'Specialties assigned',
      content: { 'application/json': { schema: withApiSuccess(z.object({ ok: z.boolean() })) } }
    }
  }
});
router.post(
  '/:id/specialties',
  requireAuth(),
  validate(assignSpecialtiesSchema),
  controller.assignSpecialties
);

export default router;
