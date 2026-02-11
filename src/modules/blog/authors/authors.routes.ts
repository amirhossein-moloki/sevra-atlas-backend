import { Router } from 'express';
import { BlogAuthorsController } from './authors.controller';
import { requireAuth, requireAdmin } from '../../../shared/middlewares/auth.middleware';
import { validate } from '../../../shared/middlewares/validate.middleware';
import { createAuthorSchema, updateAuthorSchema } from './authors.validators';

const router = Router();
const controller = new BlogAuthorsController();

router.get('/', controller.listAuthors);
router.get('/:id', controller.getAuthor);

router.post(
  '/',
  requireAuth(),
  requireAdmin(),
  validate(createAuthorSchema),
  controller.createAuthor
);

router.patch(
  '/:id',
  requireAuth(),
  requireAdmin(),
  validate(updateAuthorSchema),
  controller.updateAuthor
);

router.delete(
  '/:id',
  requireAuth(),
  requireAdmin(),
  controller.deleteAuthor
);

export default router;
