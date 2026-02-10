import { Router } from 'express';
import { BlogMiscController } from './misc.controller';
import { requireAuth, requireRole } from '../../shared/middlewares/auth.middleware';
import { UserRole } from '@prisma/client';
import { validate } from '../../shared/middlewares/validate.middleware';
import { addReactionSchema } from './misc.validators';

const router = Router();
const controller = new BlogMiscController();

router.get('/revisions/:postId', requireAuth(), controller.listRevisions);
router.post('/reactions', requireAuth(), validate(addReactionSchema), controller.addReaction);

router.get('/pages', controller.listPages);
router.get('/pages/:slug', controller.getPage);
router.post('/pages', requireAuth(), requireRole([UserRole.ADMIN]), controller.createPage);
router.patch('/pages/:id', requireAuth(), requireRole([UserRole.ADMIN]), controller.updatePage);
router.delete('/pages/:id', requireAuth(), requireRole([UserRole.ADMIN]), controller.deletePage);

router.get('/menus/:location', controller.getMenu);
router.post('/menus', requireAuth(), requireRole([UserRole.ADMIN]), controller.createMenu);
router.patch('/menus/:id', requireAuth(), requireRole([UserRole.ADMIN]), controller.updateMenu);
router.delete('/menus/:id', requireAuth(), requireRole([UserRole.ADMIN]), controller.deleteMenu);

router.post('/menu-items', requireAuth(), requireRole([UserRole.ADMIN]), controller.createMenuItem);
router.patch('/menu-items/:id', requireAuth(), requireRole([UserRole.ADMIN]), controller.updateMenuItem);
router.delete('/menu-items/:id', requireAuth(), requireRole([UserRole.ADMIN]), controller.deleteMenuItem);

export default router;
