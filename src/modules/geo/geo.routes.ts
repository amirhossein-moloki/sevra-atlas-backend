import { Router } from 'express';
import { GeoController } from './geo.controller';
import { authMiddleware, requireRole } from '../../shared/middlewares/auth.middleware';
import { UserRole } from '@prisma/client';
import { validate } from '../../shared/middlewares/validate.middleware';
import { createProvinceSchema, createCitySchema, createNeighborhoodSchema } from './geo.validators';

const router = Router();
const controller = new GeoController();

router.get('/provinces', controller.getProvinces);
router.get('/provinces/:slug/cities', controller.getProvinceCities);
router.get('/cities/:id', controller.getCity);

router.post(
  '/provinces',
  authMiddleware,
  requireRole([UserRole.ADMIN]),
  validate(createProvinceSchema),
  controller.createProvince
);

router.post(
  '/cities',
  authMiddleware,
  requireRole([UserRole.ADMIN]),
  validate(createCitySchema),
  controller.createCity
);

router.post(
  '/neighborhoods',
  authMiddleware,
  requireRole([UserRole.ADMIN]),
  validate(createNeighborhoodSchema),
  controller.createNeighborhood
);

export default router;
