import { Router } from 'express';
import { GeoController } from './geo.controller';
import { requireAuth, requireAdmin } from '../../shared/middlewares/auth.middleware';
import { validate } from '../../shared/middlewares/validate.middleware';
import { provinceSchema, citySchema, neighborhoodSchema, createProvinceSchema, createCitySchema, createNeighborhoodSchema, updateCitySchema, updateNeighborhoodSchema } from './geo.validators';
import { registry, z, withApiSuccess } from '../../shared/openapi/registry';

const router = Router();
const controller = new GeoController();

const tag = 'Geo';

registry.registerPath({
  method: 'get',
  path: '/geo/provinces',
  summary: 'List all provinces',
  tags: [tag],
  responses: {
    200: {
      description: 'List of provinces',
      content: { 'application/json': { schema: withApiSuccess(z.array(provinceSchema)) } },
    },
  },
});
router.get('/provinces', controller.getProvinces);

registry.registerPath({
  method: 'get',
  path: '/geo/provinces/{slug}/cities',
  summary: 'List cities of a province',
  tags: [tag],
  parameters: [{ name: 'slug', in: 'path', schema: { type: 'string' }, required: true }],
  responses: {
    200: {
      description: 'List of cities',
      content: {
        'application/json': {
          schema: withApiSuccess(z.array(citySchema)),
        },
      },
    },
  },
});
router.get('/provinces/:slug/cities', controller.getProvinceCities);

registry.registerPath({
  method: 'get',
  path: '/geo/cities/{slug}',
  summary: 'Get city details',
  tags: [tag],
  parameters: [{ name: 'slug', in: 'path', schema: { type: 'string' }, required: true }],
  responses: {
    200: {
      description: 'City details',
      content: { 'application/json': { schema: withApiSuccess(citySchema) } },
    },
  },
});
router.get('/cities/:slug', controller.getCity);

registry.registerPath({
  method: 'get',
  path: '/geo/cities/{slug}/neighborhoods',
  summary: 'List neighborhoods of a city',
  tags: [tag],
  parameters: [{ name: 'slug', in: 'path', schema: { type: 'string' }, required: true }],
  responses: {
    200: {
      description: 'List of neighborhoods',
      content: {
        'application/json': {
          schema: withApiSuccess(z.array(neighborhoodSchema)),
        },
      },
    },
  },
});
router.get('/cities/:slug/neighborhoods', controller.getCityNeighborhoods);

registry.registerPath({
  method: 'post',
  path: '/geo/provinces',
  summary: 'Create a province (Admin)',
  tags: [tag],
  security: [{ bearerAuth: [] }],
  request: {
    body: {
      content: { 'application/json': { schema: createProvinceSchema.shape.body } },
    },
  },
  responses: {
    201: {
      description: 'Province created',
      content: { 'application/json': { schema: withApiSuccess(provinceSchema) } },
    },
  },
});
router.post(
  '/provinces',
  requireAuth(),
  requireAdmin(),
  validate(createProvinceSchema),
  controller.createProvince
);

registry.registerPath({
  method: 'post',
  path: '/geo/cities',
  summary: 'Create a city (Admin)',
  tags: [tag],
  security: [{ bearerAuth: [] }],
  request: {
    body: {
      content: { 'application/json': { schema: createCitySchema.shape.body } },
    },
  },
  responses: {
    201: {
      description: 'City created',
      content: { 'application/json': { schema: withApiSuccess(citySchema) } },
    },
  },
});
router.post(
  '/cities',
  requireAuth(),
  requireAdmin(),
  validate(createCitySchema),
  controller.createCity
);

registry.registerPath({
  method: 'post',
  path: '/geo/neighborhoods',
  summary: 'Create a neighborhood (Admin)',
  tags: [tag],
  security: [{ bearerAuth: [] }],
  request: {
    body: {
      content: { 'application/json': { schema: createNeighborhoodSchema.shape.body } },
    },
  },
  responses: {
    201: {
      description: 'Neighborhood created',
      content: { 'application/json': { schema: withApiSuccess(neighborhoodSchema) } },
    },
  },
});
router.post(
  '/neighborhoods',
  requireAuth(),
  requireAdmin(),
  validate(createNeighborhoodSchema),
  controller.createNeighborhood
);

registry.registerPath({
  method: 'patch',
  path: '/geo/cities/{id}',
  summary: 'Update a city (Admin)',
  tags: [tag],
  security: [{ bearerAuth: [] }],
  parameters: [{ name: 'id', in: 'path', schema: { type: 'string' }, required: true }],
  request: {
    body: {
      content: { 'application/json': { schema: updateCitySchema.shape.body } },
    },
  },
  responses: {
    200: {
      description: 'City updated',
      content: { 'application/json': { schema: withApiSuccess(citySchema) } },
    },
  },
});
router.patch(
  '/cities/:id',
  requireAuth(),
  requireAdmin(),
  validate(updateCitySchema),
  controller.updateCity
);

registry.registerPath({
  method: 'patch',
  path: '/geo/neighborhoods/{id}',
  summary: 'Update a neighborhood (Admin)',
  tags: [tag],
  security: [{ bearerAuth: [] }],
  parameters: [{ name: 'id', in: 'path', schema: { type: 'string' }, required: true }],
  request: {
    body: {
      content: { 'application/json': { schema: updateNeighborhoodSchema.shape.body } },
    },
  },
  responses: {
    200: {
      description: 'Neighborhood updated',
      content: { 'application/json': { schema: withApiSuccess(neighborhoodSchema) } },
    },
  },
});
router.patch(
  '/neighborhoods/:id',
  requireAuth(),
  requireAdmin(),
  validate(updateNeighborhoodSchema),
  controller.updateNeighborhood
);

export default router;
