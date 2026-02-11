import { Router } from 'express';
import { SalonsController } from './salons.controller';
import { ReviewsController } from '../reviews/reviews.controller';
import { requireAuth, requireRole } from '../../shared/middlewares/auth.middleware';
import { UserRole } from '@prisma/client';
import { validate } from '../../shared/middlewares/validate.middleware';
import { createSalonSchema, updateSalonSchema, assignServicesSchema, linkArtistSchema } from './salons.validators';
import { registry, z, withApiSuccess } from '../../shared/openapi/registry';
import { SalonSchema, ReviewSchema, MediaSchema } from '../../shared/openapi/schemas';

const router = Router();
const controller = new SalonsController();
const reviewsController = new ReviewsController();

const tag = 'Salons';

registry.registerPath({
  method: 'get',
  path: '/salons',
  summary: 'List all salons',
  tags: [tag],
  responses: {
    200: {
      description: 'List of salons',
      content: { 'application/json': { schema: withApiSuccess(z.array(SalonSchema)) } }
    }
  }
});
router.get('/', controller.getSalons);

registry.registerPath({
  method: 'get',
  path: '/salons/{slug}',
  summary: 'Get salon by slug',
  tags: [tag],
  parameters: [{ name: 'slug', in: 'path', schema: { type: 'string' }, required: true }],
  responses: {
    200: {
      description: 'Salon details',
      content: { 'application/json': { schema: withApiSuccess(SalonSchema) } }
    }
  }
});
router.get('/:slug', controller.getSalon);

registry.registerPath({
  method: 'get',
  path: '/salons/{slug}/reviews',
  summary: 'Get salon reviews',
  tags: [tag],
  parameters: [{ name: 'slug', in: 'path', schema: { type: 'string' }, required: true }],
  responses: {
    200: {
      description: 'List of reviews',
      content: { 'application/json': { schema: withApiSuccess(z.array(ReviewSchema)) } }
    }
  }
});
router.get('/:slug/reviews', reviewsController.getSalonReviews);

registry.registerPath({
  method: 'post',
  path: '/salons',
  summary: 'Create a salon',
  tags: [tag],
  security: [{ bearerAuth: [] }],
  request: {
    body: { content: { 'application/json': { schema: createSalonSchema.shape.body } } }
  },
  responses: {
    201: {
      description: 'Salon created',
      content: { 'application/json': { schema: withApiSuccess(SalonSchema) } }
    }
  }
});
router.get('/:slug', controller.getSalon);
router.get('/:slug/reviews', reviewsController.getSalonReviews);

router.post(
  '/',
  requireAuth(),
  requireRole([UserRole.SALON, UserRole.ADMIN]),
  validate(createSalonSchema),
  controller.createSalon
);

registry.registerPath({
  method: 'patch',
  path: '/salons/{id}',
  summary: 'Update a salon',
  tags: [tag],
  security: [{ bearerAuth: [] }],
  parameters: [{ name: 'id', in: 'path', schema: { type: 'string' }, required: true }],
  request: {
    body: { content: { 'application/json': { schema: updateSalonSchema.shape.body } } }
  },
  responses: {
    200: {
      description: 'Salon updated',
      content: { 'application/json': { schema: withApiSuccess(SalonSchema) } }
    }
  }
});
router.patch(
  '/:id',
  requireAuth(),
  validate(updateSalonSchema),
  controller.updateSalon
);

registry.registerPath({
  method: 'delete',
  path: '/salons/{id}',
  summary: 'Delete a salon',
  tags: [tag],
  security: [{ bearerAuth: [] }],
  parameters: [{ name: 'id', in: 'path', schema: { type: 'string' }, required: true }],
  responses: {
    200: {
      description: 'Salon deleted',
      content: { 'application/json': { schema: withApiSuccess(z.object({ ok: z.boolean() })) } }
    }
  }
});
router.delete(
  '/:id',
  requireAuth(),
  controller.deleteSalon
);

registry.registerPath({
  method: 'post',
  path: '/salons/{id}/services',
  summary: 'Assign services to salon',
  tags: [tag],
  security: [{ bearerAuth: [] }],
  parameters: [{ name: 'id', in: 'path', schema: { type: 'string' }, required: true }],
  request: {
    body: { content: { 'application/json': { schema: assignServicesSchema.shape.body } } }
  },
  responses: {
    200: {
      description: 'Services assigned',
      content: { 'application/json': { schema: withApiSuccess(z.object({ ok: z.boolean() })) } }
    }
  }
});
router.post(
  '/:id/services',
  requireAuth(),
  validate(assignServicesSchema),
  controller.assignServices
);

registry.registerPath({
  method: 'delete',
  path: '/salons/{id}/services/{serviceId}',
  summary: 'Remove service from salon',
  tags: [tag],
  security: [{ bearerAuth: [] }],
  parameters: [
    { name: 'id', in: 'path', schema: { type: 'string' }, required: true },
    { name: 'serviceId', in: 'path', schema: { type: 'string' }, required: true }
  ],
  responses: {
    200: {
      description: 'Service removed',
      content: { 'application/json': { schema: withApiSuccess(z.object({ ok: z.boolean() })) } }
    }
  }
});
router.delete(
  '/:id/services/:serviceId',
  requireAuth(),
  controller.removeService
);

registry.registerPath({
  method: 'post',
  path: '/salons/{id}/avatar',
  summary: 'Set salon avatar',
  tags: [tag],
  security: [{ bearerAuth: [] }],
  parameters: [{ name: 'id', in: 'path', schema: { type: 'string' }, required: true }],
  request: {
    body: {
      content: { 'application/json': { schema: z.object({ mediaId: z.string() }) } }
    }
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
  path: '/salons/{id}/cover',
  summary: 'Set salon cover',
  tags: [tag],
  security: [{ bearerAuth: [] }],
  parameters: [{ name: 'id', in: 'path', schema: { type: 'string' }, required: true }],
  request: {
    body: {
      content: { 'application/json': { schema: z.object({ mediaId: z.string() }) } }
    }
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
  path: '/salons/{id}/gallery',
  summary: 'Add to salon gallery',
  tags: [tag],
  security: [{ bearerAuth: [] }],
  parameters: [{ name: 'id', in: 'path', schema: { type: 'string' }, required: true }],
  request: {
    body: {
      content: { 'application/json': { schema: z.object({ mediaIds: z.array(z.string()) }) } }
    }
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
  path: '/salons/{id}/artists',
  summary: 'Link artist to salon',
  tags: [tag],
  security: [{ bearerAuth: [] }],
  parameters: [{ name: 'id', in: 'path', schema: { type: 'string' }, required: true }],
  request: {
    body: { content: { 'application/json': { schema: linkArtistSchema.shape.body } } }
  },
  responses: {
    200: {
      description: 'Artist linked',
      content: { 'application/json': { schema: withApiSuccess(z.object({ id: z.string(), roleTitle: z.string().nullable() })) } }
    }
  }
});
router.post(
  '/:id/artists',
  requireAuth(),
  validate(linkArtistSchema),
  controller.linkArtist
);

registry.registerPath({
  method: 'delete',
  path: '/salons/{id}/artists/{artistId}',
  summary: 'Unlink artist from salon',
  tags: [tag],
  security: [{ bearerAuth: [] }],
  parameters: [
    { name: 'id', in: 'path', schema: { type: 'string' }, required: true },
    { name: 'artistId', in: 'path', schema: { type: 'string' }, required: true }
  ],
  responses: {
    200: {
      description: 'Artist unlinked',
      content: { 'application/json': { schema: withApiSuccess(z.object({ ok: z.boolean() })) } }
    }
  }
});
router.delete(
  '/:id/artists/:artistId',
  requireAuth(),
  controller.unlinkArtist
);

export default router;
