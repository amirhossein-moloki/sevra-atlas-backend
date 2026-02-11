import { Router } from 'express';
import { SeoController } from './seo.controller';
import { authMiddleware, requireAdmin } from '../../shared/middlewares/auth.middleware';
import { validate } from '../../shared/middlewares/validate.middleware';
import { setSeoMetaSchema, createRedirectSchema } from './seo.validators';
import { registry, z, withApiSuccess } from '../../shared/openapi/registry';
import { SeoMetaSchema } from '../../shared/openapi/schemas';

const router = Router();
const controller = new SeoController();

const tag = 'SEO';

registry.registerPath({
  method: 'get',
  path: '/seo/redirects/resolve',
  summary: 'Resolve a redirect',
  tags: [tag],
  parameters: [{ name: 'path', in: 'query', schema: { type: 'string' }, required: true }],
  responses: {
    200: {
      description: 'Redirect resolved',
      content: { 'application/json': { schema: withApiSuccess(z.object({ toPath: z.string(), type: z.number() })) } }
    }
  }
});
router.get('/redirects/resolve', controller.resolveRedirect);

registry.registerPath({
  method: 'post',
  path: '/seo/meta',
  summary: 'Set SEO meta for an entity (Admin)',
  tags: [tag],
  security: [{ bearerAuth: [] }],
  request: {
    body: { content: { 'application/json': { schema: setSeoMetaSchema.shape.body } } }
  },
  responses: {
    200: {
      description: 'Meta set successfully',
      content: { 'application/json': { schema: withApiSuccess(SeoMetaSchema) } }
    }
  }
});
router.post(
  '/meta',
  authMiddleware,
  requireAdmin(),
  validate(setSeoMetaSchema),
  controller.setSeoMeta
);

registry.registerPath({
  method: 'post',
  path: '/seo/redirects',
  summary: 'Create a redirect rule (Admin)',
  tags: [tag],
  security: [{ bearerAuth: [] }],
  request: {
    body: { content: { 'application/json': { schema: createRedirectSchema.shape.body } } }
  },
  responses: {
    201: {
      description: 'Redirect created',
      content: { 'application/json': { schema: withApiSuccess(z.object({ id: z.string() })) } }
    }
  }
});
router.post(
  '/redirects',
  authMiddleware,
  requireAdmin(),
  validate(createRedirectSchema),
  controller.createRedirect
);

registry.registerPath({
  method: 'post',
  path: '/seo/sitemap/rebuild',
  summary: 'Rebuild sitemap (Admin)',
  tags: [tag],
  security: [{ bearerAuth: [] }],
  responses: {
    200: {
      description: 'Sitemap rebuilding started',
      content: { 'application/json': { schema: withApiSuccess(z.object({ message: z.string() })) } }
    }
  }
});
router.post(
  '/sitemap/rebuild',
  authMiddleware,
  requireAdmin(),
  controller.rebuildSitemap
);

export default router;
