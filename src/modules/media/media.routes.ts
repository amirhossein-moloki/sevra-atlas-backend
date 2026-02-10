import { Router } from 'express';
import { MediaController } from './media.controller';
import { authMiddleware } from '../../shared/middlewares/auth.middleware';
import { validate } from '../../shared/middlewares/validate.middleware';
import { createMediaSchema } from './media.validators';

const router = Router();
const controller = new MediaController();

router.post(
  '/',
  authMiddleware,
  validate(createMediaSchema),
  controller.createMedia
);

router.get('/:id', controller.getMedia);

export default router;
