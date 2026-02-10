import { Router } from 'express';
import { BlogMiscController } from './misc.controller';
import { requireAuth } from '../../shared/middlewares/auth.middleware';
import { validate } from '../../shared/middlewares/validate.middleware';
import { addReactionSchema } from './misc.validators';

const router = Router();
const controller = new BlogMiscController();

router.get('/revisions/:postId', requireAuth(), controller.listRevisions);
router.post('/reactions', requireAuth(), validate(addReactionSchema), controller.addReaction);
router.get('/pages', controller.listPages);
router.get('/pages/:slug', controller.getPage);
router.get('/menus/:location', controller.getMenu);

export default router;
