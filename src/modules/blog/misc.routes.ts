import { Router } from 'express';
import { BlogMiscController } from './misc.controller';
import { requireAuth, requireAdmin } from '../../shared/middlewares/auth.middleware';
import { validate } from '../../shared/middlewares/validate.middleware';
import {
  addReactionSchema,
  createPageSchema,
  updatePageSchema,
  createMenuSchema,
  updateMenuSchema,
  createMenuItemSchema,
  updateMenuItemSchema,
} from './misc.validators';
import { registry, z, withApiSuccess } from '../../shared/openapi/registry';
import { RevisionSchema, ReactionSchema, PageSchema, MenuSchema, MenuItemSchema } from '../../shared/openapi/schemas';

const router = Router();
const controller = new BlogMiscController();

const tag = 'Blog Misc';

registry.registerPath({
  method: 'get',
  path: '/blog/misc/revisions/{postId}',
  summary: 'List post revisions',
  tags: [tag],
  security: [{ bearerAuth: [] }],
  parameters: [{ name: 'postId', in: 'path', schema: { type: 'string' }, required: true }],
  responses: {
    200: {
      description: 'List of revisions',
      content: { 'application/json': { schema: withApiSuccess(z.array(RevisionSchema)) } }
    }
  }
});
router.get('/revisions/:postId', requireAuth(), controller.listRevisions);

registry.registerPath({
  method: 'post',
  path: '/blog/misc/reactions',
  summary: 'Add reaction to post',
  tags: [tag],
  security: [{ bearerAuth: [] }],
  request: {
    body: { content: { 'application/json': { schema: addReactionSchema.shape.body } } }
  },
  responses: {
    200: {
      description: 'Reaction added',
      content: { 'application/json': { schema: withApiSuccess(ReactionSchema) } }
    }
  }
});
router.post('/reactions', requireAuth(), validate(addReactionSchema), controller.addReaction);

registry.registerPath({
  method: 'get',
  path: '/blog/misc/pages',
  summary: 'List pages',
  tags: [tag],
  responses: {
    200: {
      description: 'List of pages',
      content: { 'application/json': { schema: withApiSuccess(z.array(PageSchema)) } }
    }
  }
});
router.get('/pages', controller.listPages);

registry.registerPath({
  method: 'get',
  path: '/blog/misc/pages/{slug}',
  summary: 'Get page by slug',
  tags: [tag],
  parameters: [{ name: 'slug', in: 'path', schema: { type: 'string' }, required: true }],
  responses: {
    200: {
      description: 'Page details',
      content: { 'application/json': { schema: withApiSuccess(PageSchema) } }
    }
  }
});
router.get('/pages/:slug', controller.getPage);

registry.registerPath({
  method: 'post',
  path: '/blog/misc/pages',
  summary: 'Create page (Admin)',
  tags: [tag],
  security: [{ bearerAuth: [] }],
  request: {
    body: { content: { 'application/json': { schema: createPageSchema.shape.body } } }
  },
  responses: {
    201: {
      description: 'Page created',
      content: { 'application/json': { schema: withApiSuccess(PageSchema) } }
    }
  }
});
router.post(
  '/pages',
  requireAuth(),
  requireAdmin(),
  validate(createPageSchema),
  controller.createPage
);

registry.registerPath({
  method: 'patch',
  path: '/blog/misc/pages/{id}',
  summary: 'Update page (Admin)',
  tags: [tag],
  security: [{ bearerAuth: [] }],
  parameters: [{ name: 'id', in: 'path', schema: { type: 'string' }, required: true }],
  request: {
    body: { content: { 'application/json': { schema: updatePageSchema.shape.body } } }
  },
  responses: {
    200: {
      description: 'Page updated',
      content: { 'application/json': { schema: withApiSuccess(PageSchema) } }
    }
  }
});
router.patch(
  '/pages/:id',
  requireAuth(),
  requireAdmin(),
  validate(updatePageSchema),
  controller.updatePage
);

registry.registerPath({
  method: 'delete',
  path: '/blog/misc/pages/{id}',
  summary: 'Delete page (Admin)',
  tags: [tag],
  security: [{ bearerAuth: [] }],
  parameters: [{ name: 'id', in: 'path', schema: { type: 'string' }, required: true }],
  responses: {
    200: {
      description: 'Page deleted',
      content: { 'application/json': { schema: withApiSuccess(z.object({ ok: z.boolean() })) } }
    }
  }
});
router.delete('/pages/:id', requireAuth(), requireAdmin(), controller.deletePage);

registry.registerPath({
  method: 'get',
  path: '/blog/misc/menus/{location}',
  summary: 'Get menu by location',
  tags: [tag],
  parameters: [{ name: 'location', in: 'path', schema: { type: 'string' }, required: true }],
  responses: {
    200: {
      description: 'Menu details',
      content: { 'application/json': { schema: withApiSuccess(MenuSchema) } }
    }
  }
});
router.get('/menus/:location', controller.getMenu);

registry.registerPath({
  method: 'post',
  path: '/blog/misc/menus',
  summary: 'Create menu (Admin)',
  tags: [tag],
  security: [{ bearerAuth: [] }],
  request: {
    body: { content: { 'application/json': { schema: createMenuSchema.shape.body } } }
  },
  responses: {
    201: {
      description: 'Menu created',
      content: { 'application/json': { schema: withApiSuccess(MenuSchema) } }
    }
  }
});
router.post(
  '/menus',
  requireAuth(),
  requireAdmin(),
  validate(createMenuSchema),
  controller.createMenu
);

registry.registerPath({
  method: 'patch',
  path: '/blog/misc/menus/{id}',
  summary: 'Update menu (Admin)',
  tags: [tag],
  security: [{ bearerAuth: [] }],
  parameters: [{ name: 'id', in: 'path', schema: { type: 'string' }, required: true }],
  request: {
    body: { content: { 'application/json': { schema: updateMenuSchema.shape.body } } }
  },
  responses: {
    200: {
      description: 'Menu updated',
      content: { 'application/json': { schema: withApiSuccess(MenuSchema) } }
    }
  }
});
router.patch(
  '/menus/:id',
  requireAuth(),
  requireAdmin(),
  validate(updateMenuSchema),
  controller.updateMenu
);

registry.registerPath({
  method: 'delete',
  path: '/blog/misc/menus/{id}',
  summary: 'Delete menu (Admin)',
  tags: [tag],
  security: [{ bearerAuth: [] }],
  parameters: [{ name: 'id', in: 'path', schema: { type: 'string' }, required: true }],
  responses: {
    200: {
      description: 'Menu deleted',
      content: { 'application/json': { schema: withApiSuccess(z.object({ ok: z.boolean() })) } }
    }
  }
});
router.delete('/menus/:id', requireAuth(), requireAdmin(), controller.deleteMenu);

registry.registerPath({
  method: 'post',
  path: '/blog/misc/menu-items',
  summary: 'Create menu item (Admin)',
  tags: [tag],
  security: [{ bearerAuth: [] }],
  request: {
    body: { content: { 'application/json': { schema: createMenuItemSchema.shape.body } } }
  },
  responses: {
    201: {
      description: 'Menu item created',
      content: { 'application/json': { schema: withApiSuccess(MenuItemSchema) } }
    }
  }
});
router.post(
  '/menu-items',
  requireAuth(),
  requireAdmin(),
  validate(createMenuItemSchema),
  controller.createMenuItem
);

registry.registerPath({
  method: 'patch',
  path: '/blog/misc/menu-items/{id}',
  summary: 'Update menu item (Admin)',
  tags: [tag],
  security: [{ bearerAuth: [] }],
  parameters: [{ name: 'id', in: 'path', schema: { type: 'string' }, required: true }],
  request: {
    body: { content: { 'application/json': { schema: updateMenuItemSchema.shape.body } } }
  },
  responses: {
    200: {
      description: 'Menu item updated',
      content: { 'application/json': { schema: withApiSuccess(MenuItemSchema) } }
    }
  }
});
router.patch(
  '/menu-items/:id',
  requireAuth(),
  requireAdmin(),
  validate(updateMenuItemSchema),
  controller.updateMenuItem
);

registry.registerPath({
  method: 'delete',
  path: '/blog/misc/menu-items/{id}',
  summary: 'Delete menu item (Admin)',
  tags: [tag],
  security: [{ bearerAuth: [] }],
  parameters: [{ name: 'id', in: 'path', schema: { type: 'string' }, required: true }],
  responses: {
    200: {
      description: 'Menu item deleted',
      content: { 'application/json': { schema: withApiSuccess(z.object({ ok: z.boolean() })) } }
    }
  }
});
router.delete('/menu-items/:id', requireAuth(), requireAdmin(), controller.deleteMenuItem);

export default router;
