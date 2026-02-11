import { Router } from 'express';
import { SeoController } from './seo.controller';
import { authMiddleware, requireAdmin } from '../../shared/middlewares/auth.middleware';
import { validate } from '../../shared/middlewares/validate.middleware';
import { setSeoMetaSchema, createRedirectSchema } from './seo.validators';

const router = Router();
const controller = new SeoController();

router.get('/redirects/resolve', controller.resolveRedirect);

router.post(
  '/meta',
  authMiddleware,
  requireAdmin(),
  validate(setSeoMetaSchema),
  controller.setSeoMeta
);

router.post(
  '/redirects',
  authMiddleware,
  requireAdmin(),
  validate(createRedirectSchema),
  controller.createRedirect
);

router.post(
  '/sitemap/rebuild',
  authMiddleware,
  requireAdmin(),
  controller.rebuildSitemap
);

export default router;
