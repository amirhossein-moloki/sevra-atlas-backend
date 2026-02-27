import { Router } from 'express';
import { SalonsController } from './salons.controller';
import { ReviewsController } from '../reviews/reviews.controller';
import { requireAuth, requireRole } from '../../shared/middlewares/auth.middleware';
import { UserRole } from '@prisma/client';
import { validate } from '../../shared/middlewares/validate.middleware';
import { createSalonSchema, updateSalonSchema, assignServicesSchema, linkArtistSchema, setMediaSchema } from './salons.validators';
import { registry, z, withApiSuccess } from '../../shared/openapi/registry';
import { SalonSchema, ReviewSchema, MediaSchema, SalonArtistResponseSchema, GroupedSalonServiceResponseSchema } from '../../shared/openapi/schemas';

const router = Router();
const controller = new SalonsController();
const reviewsController = new ReviewsController();

const tag = 'Salons';

registry.registerPath({
  method: 'get',
  path: '/salons',
  summary: 'List all salons',
  tags: [tag],
  parameters: [
    { name: 'q', in: 'query', schema: { type: 'string' }, description: 'Search term for name, summary or description' },
    { name: 'province', in: 'query', schema: { type: 'string' }, description: 'Province slug' },
    { name: 'city', in: 'query', schema: { type: 'string' }, description: 'City slug' },
    { name: 'neighborhood', in: 'query', schema: { type: 'string' }, description: 'Neighborhood slug' },
    { name: 'service', in: 'query', schema: { type: 'string' }, description: 'Service slug' },
    { name: 'verified', in: 'query', schema: { type: 'string', enum: ['true', 'false'] } },
    { name: 'minRating', in: 'query', schema: { type: 'number' } },
    { name: 'minReviewCount', in: 'query', schema: { type: 'integer' } },
    { name: 'womenOnly', in: 'query', schema: { type: 'string', enum: ['true', 'false'] } },
    { name: 'priceTier', in: 'query', schema: { type: 'integer', minimum: 1, maximum: 4 } },
    { name: 'sort', in: 'query', schema: { type: 'string', enum: ['rating', 'popular', 'new'] } },
    { name: 'page', in: 'query', schema: { type: 'integer', default: 1 } },
    { name: 'pageSize', in: 'query', schema: { type: 'integer', default: 20 } },
  ],
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
  path: '/salons/{idOrSlug}',
  summary: 'Get salon by slug or ID',
  tags: [tag],
  parameters: [{ name: 'idOrSlug', in: 'path', schema: { type: 'string' }, required: true }],
  responses: {
    200: {
      description: 'Salon details',
      content: { 'application/json': { schema: withApiSuccess(SalonSchema) } }
    }
  }
});
router.get('/:idOrSlug', controller.getSalon);

registry.registerPath({
  method: 'get',
  path: '/salons/{idOrSlug}/reviews',
  summary: 'Get salon reviews',
  tags: [tag],
  parameters: [{ name: 'idOrSlug', in: 'path', schema: { type: 'string' }, required: true }],
  responses: {
    200: {
      description: 'List of reviews',
      content: { 'application/json': { schema: withApiSuccess(z.array(ReviewSchema)) } }
    }
  }
});
router.get('/:idOrSlug/reviews', reviewsController.getSalonReviews);

registry.registerPath({
  method: 'get',
  path: '/salons/{idOrSlug}/artists',
  summary: 'Get salon artists',
  tags: [tag],
  parameters: [{ name: 'idOrSlug', in: 'path', schema: { type: 'string' }, required: true }],
  responses: {
    200: {
      description: 'List of artists in the salon',
      content: { 'application/json': { schema: withApiSuccess(z.array(SalonArtistResponseSchema)) } }
    }
  }
});
router.get('/:idOrSlug/artists', controller.getSalonArtists);

registry.registerPath({
  method: 'get',
  path: '/salons/{idOrSlug}/services',
  summary: 'Get salon services grouped by category',
  tags: [tag],
  parameters: [{ name: 'idOrSlug', in: 'path', schema: { type: 'string' }, required: true }],
  responses: {
    200: {
      description: 'Salon services grouped by category',
      content: { 'application/json': { schema: withApiSuccess(z.array(GroupedSalonServiceResponseSchema)) } }
    }
  }
});
router.get('/:idOrSlug/services', controller.getSalonServices);

registry.registerPath({
  method: 'get',
  path: '/salons/{idOrSlug}/gallery',
  summary: 'Get salon gallery',
  tags: [tag],
  parameters: [
    { name: 'idOrSlug', in: 'path', schema: { type: 'string' }, required: true },
    { name: 'page', in: 'query', schema: { type: 'integer', default: 1 } },
    { name: 'pageSize', in: 'query', schema: { type: 'integer', default: 20 } },
  ],
  responses: {
    200: {
      description: 'Salon gallery images',
      content: {
        'application/json': {
          schema: withApiSuccess(z.object({
            items: z.array(MediaSchema),
            page: z.number(),
            limit: z.number(),
            total: z.number(),
          }))
        }
      }
    }
  }
});

registry.registerPath({
  method: 'get',
  path: '/salons/{idOrSlug}/media',
  summary: 'Get salon media (alias for gallery)',
  tags: [tag],
  parameters: [
    { name: 'idOrSlug', in: 'path', schema: { type: 'string' }, required: true },
    { name: 'page', in: 'query', schema: { type: 'integer', default: 1 } },
    { name: 'pageSize', in: 'query', schema: { type: 'integer', default: 20 } },
  ],
  responses: {
    200: {
      description: 'Salon gallery images',
      content: {
        'application/json': {
          schema: withApiSuccess(z.object({
            items: z.array(MediaSchema),
            page: z.number(),
            limit: z.number(),
            total: z.number(),
          }))
        }
      }
    }
  }
});
router.get('/:idOrSlug/gallery', controller.getGallery);
router.get('/:idOrSlug/media', controller.getGallery); // Alias

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

router.post(
  '/',
  requireAuth(),
  requireRole([UserRole.SALON, UserRole.ADMIN]),
  validate(createSalonSchema),
  controller.createSalon
);

registry.registerPath({
  method: 'patch',
  path: '/salons/{idOrSlug}',
  summary: 'Update a salon',
  tags: [tag],
  security: [{ bearerAuth: [] }],
  parameters: [{ name: 'idOrSlug', in: 'path', schema: { type: 'string' }, required: true }],
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
  '/:idOrSlug',
  requireAuth(),
  validate(updateSalonSchema),
  controller.updateSalon
);

registry.registerPath({
  method: 'delete',
  path: '/salons/{idOrSlug}',
  summary: 'Delete a salon',
  tags: [tag],
  security: [{ bearerAuth: [] }],
  parameters: [{ name: 'idOrSlug', in: 'path', schema: { type: 'string' }, required: true }],
  responses: {
    200: {
      description: 'Salon deleted',
      content: { 'application/json': { schema: withApiSuccess(z.object({ ok: z.boolean() })) } }
    }
  }
});
router.delete(
  '/:idOrSlug',
  requireAuth(),
  controller.deleteSalon
);

registry.registerPath({
  method: 'put',
  path: '/salons/{idOrSlug}/services',
  summary: 'Bulk upsert services for salon',
  tags: [tag],
  security: [{ bearerAuth: [] }],
  parameters: [
    { name: 'idOrSlug', in: 'path', schema: { type: 'string' }, required: true },
    { name: 'replace', in: 'query', schema: { type: 'boolean' }, description: 'If true, services not in body will be removed' }
  ],
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
router.put(
  '/:idOrSlug/services',
  requireAuth(),
  validate(assignServicesSchema),
  controller.assignServices
);

registry.registerPath({
  method: 'post',
  path: '/salons/{idOrSlug}/services',
  summary: 'Assign services to salon (Legacy)',
  tags: [tag],
  security: [{ bearerAuth: [] }],
  parameters: [{ name: 'idOrSlug', in: 'path', schema: { type: 'string' }, required: true }],
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
  '/:idOrSlug/services',
  requireAuth(),
  validate(assignServicesSchema),
  controller.assignServices
);

registry.registerPath({
  method: 'delete',
  path: '/salons/{idOrSlug}/services/{serviceId}',
  summary: 'Remove service from salon',
  tags: [tag],
  security: [{ bearerAuth: [] }],
  parameters: [
    { name: 'idOrSlug', in: 'path', schema: { type: 'string' }, required: true },
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
  '/:idOrSlug/services/:serviceId',
  requireAuth(),
  controller.removeService
);

registry.registerPath({
  method: 'post',
  path: '/salons/{idOrSlug}/avatar',
  summary: 'Set salon avatar',
  tags: [tag],
  security: [{ bearerAuth: [] }],
  parameters: [{ name: 'idOrSlug', in: 'path', schema: { type: 'string' }, required: true }],
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
  '/:idOrSlug/avatar',
  requireAuth(),
  validate(setMediaSchema),
  controller.setAvatar
);

registry.registerPath({
  method: 'post',
  path: '/salons/{idOrSlug}/cover',
  summary: 'Set salon cover',
  tags: [tag],
  security: [{ bearerAuth: [] }],
  parameters: [{ name: 'idOrSlug', in: 'path', schema: { type: 'string' }, required: true }],
  request: {
    body: {
      content: { 'application/json': { schema: setMediaSchema.shape.body } }
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
  '/:idOrSlug/cover',
  requireAuth(),
  validate(setMediaSchema),
  controller.setCover
);

registry.registerPath({
  method: 'post',
  path: '/salons/{idOrSlug}/gallery',
  summary: 'Add to salon gallery',
  tags: [tag],
  security: [{ bearerAuth: [] }],
  parameters: [{ name: 'idOrSlug', in: 'path', schema: { type: 'string' }, required: true }],
  request: {
    body: {
      content: { 'application/json': { schema: setMediaSchema.shape.body } }
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
  '/:idOrSlug/gallery',
  requireAuth(),
  validate(setMediaSchema),
  controller.addGallery
);

registry.registerPath({
  method: 'post',
  path: '/salons/{idOrSlug}/artists',
  summary: 'Link artist to salon',
  tags: [tag],
  security: [{ bearerAuth: [] }],
  parameters: [{ name: 'idOrSlug', in: 'path', schema: { type: 'string' }, required: true }],
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
  '/:idOrSlug/artists',
  requireAuth(),
  validate(linkArtistSchema),
  controller.linkArtist
);

registry.registerPath({
  method: 'delete',
  path: '/salons/{idOrSlug}/artists/{artistId}',
  summary: 'Unlink artist from salon',
  tags: [tag],
  security: [{ bearerAuth: [] }],
  parameters: [
    { name: 'idOrSlug', in: 'path', schema: { type: 'string' }, required: true },
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
  '/:idOrSlug/artists/:artistId',
  requireAuth(),
  controller.unlinkArtist
);

export default router;
