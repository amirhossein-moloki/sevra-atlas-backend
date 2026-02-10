import { Router } from 'express';
import { SavesController } from './saves.controller';
import { requireAuth } from '../../shared/middlewares/auth.middleware';

const router = Router();
const controller = new SavesController();

router.post('/', requireAuth(), controller.save);
router.delete('/', requireAuth(), controller.unsave);
router.get('/me', requireAuth(), controller.getMySaves);

export default router;
