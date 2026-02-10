import { Router } from 'express';
import { GeoController } from './geo.controller';
import { requireAuth, requireRole } from '../../shared/middlewares/auth.middleware';
import { UserRole } from '@prisma/client';
import { validate } from '../../shared/middlewares/validate.middleware';
import { createProvinceSchema, createCitySchema, createNeighborhoodSchema, updateCitySchema, updateNeighborhoodSchema } from './geo.validators';

const router = Router();
const controller = new GeoController();

router.get('/provinces', controller.getProvinces);
router.get('/provinces/:slug/cities', controller.getProvinceCities);
router.get('/cities/:slug', controller.getCity);
router.get('/cities/:slug/neighborhoods', controller.getCityNeighborhoods);

router.post(
  '/provinces',
  requireAuth(),
  requireRole([UserRole.ADMIN]),
  validate(createProvinceSchema),
  controller.createProvince
);

router.post(
  '/cities',
  requireAuth(),
  requireRole([UserRole.ADMIN]),
  validate(createCitySchema),
  controller.createCity
);

router.post(
  '/neighborhoods',
  requireAuth(),
  requireRole([UserRole.ADMIN]),
  validate(createNeighborhoodSchema),
  controller.createNeighborhood
);

router.patch(
  '/cities/:id',
  requireAuth(),
  requireRole([UserRole.ADMIN]),
  validate(updateCitySchema),
  controller.updateCity
);

router.patch(
  '/neighborhoods/:id',
  requireAuth(),
  requireRole([UserRole.ADMIN]),
  validate(updateNeighborhoodSchema),
  controller.updateNeighborhood
);

export default router;
