import { Router } from 'express';
import { SeoController } from './seo.controller';
import { authMiddleware, requireRole } from '../../shared/middlewares/auth.middleware';
import { UserRole } from '@prisma/client';
import { validate } from '../../shared/middlewares/validate.middleware';
import { setSeoMetaSchema, createRedirectSchema } from './seo.validators';

const router = Router();
const controller = new SeoController();

router.get('/redirects/resolve', controller.resolveRedirect);

router.post(
  '/meta',
  authMiddleware,
  requireRole([UserRole.ADMIN]),
  validate(setSeoMetaSchema),
  controller.setSeoMeta
);

router.post(
  '/redirects',
  authMiddleware,
  requireRole([UserRole.ADMIN]),
  validate(createRedirectSchema),
  controller.createRedirect
);

router.post(
  '/sitemap/rebuild',
  authMiddleware,
  requireRole([UserRole.ADMIN]),
  controller.rebuildSitemap
);

export default router;
