import { Router } from 'express';
import { MediaController } from './media.controller';
import { authMiddleware } from '../../shared/middlewares/auth.middleware';
import { validate } from '../../shared/middlewares/validate.middleware';
import { createMediaSchema } from './media.validators';

const router = Router();
const controller = new MediaController();

router.get('/', authMiddleware, controller.listMedia);

router.post(
  '/',
  authMiddleware,
  validate(createMediaSchema),
  controller.createMedia
);

router.get('/:id', controller.getMedia);
router.get('/:id/download', controller.downloadMedia);

router.delete('/:id', authMiddleware, controller.deleteMedia);

export default router;
