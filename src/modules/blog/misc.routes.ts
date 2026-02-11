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

const router = Router();
const controller = new BlogMiscController();

router.get('/revisions/:postId', requireAuth(), controller.listRevisions);
router.post('/reactions', requireAuth(), validate(addReactionSchema), controller.addReaction);

router.get('/pages', controller.listPages);
router.get('/pages/:slug', controller.getPage);
router.post(
  '/pages',
  requireAuth(),
  requireAdmin(),
  validate(createPageSchema),
  controller.createPage
);
router.patch(
  '/pages/:id',
  requireAuth(),
  requireAdmin(),
  validate(updatePageSchema),
  controller.updatePage
);
router.delete('/pages/:id', requireAuth(), requireAdmin(), controller.deletePage);

router.get('/menus/:location', controller.getMenu);
router.post(
  '/menus',
  requireAuth(),
  requireAdmin(),
  validate(createMenuSchema),
  controller.createMenu
);
router.patch(
  '/menus/:id',
  requireAuth(),
  requireAdmin(),
  validate(updateMenuSchema),
  controller.updateMenu
);
router.delete('/menus/:id', requireAuth(), requireAdmin(), controller.deleteMenu);

router.post(
  '/menu-items',
  requireAuth(),
  requireAdmin(),
  validate(createMenuItemSchema),
  controller.createMenuItem
);
router.patch(
  '/menu-items/:id',
  requireAuth(),
  requireAdmin(),
  validate(updateMenuItemSchema),
  controller.updateMenuItem
);
router.delete('/menu-items/:id', requireAuth(), requireAdmin(), controller.deleteMenuItem);

export default router;
