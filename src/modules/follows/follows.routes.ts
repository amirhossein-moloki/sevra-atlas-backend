import { Router } from 'express';
import { FollowsController } from './follows.controller';
import { requireAuth } from '../../shared/middlewares/auth.middleware';

const router = Router();
const controller = new FollowsController();

router.post('/', requireAuth(), controller.follow);
router.delete('/', requireAuth(), controller.unfollow);
router.get('/me', requireAuth(), controller.getMyFollows);

export default router;
