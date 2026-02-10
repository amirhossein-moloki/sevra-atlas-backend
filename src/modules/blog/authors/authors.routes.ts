import { Router } from 'express';
import { BlogAuthorsController } from './authors.controller';
import { requireAuth, requireRole } from '../../../shared/middlewares/auth.middleware';
import { UserRole } from '@prisma/client';
import { validate } from '../../../shared/middlewares/validate.middleware';
import { createAuthorSchema, updateAuthorSchema } from './authors.validators';

const router = Router();
const controller = new BlogAuthorsController();

router.get('/', controller.listAuthors);
router.get('/:id', controller.getAuthor);

router.post(
  '/',
  requireAuth(),
  requireRole([UserRole.ADMIN]),
  validate(createAuthorSchema),
  controller.createAuthor
);

router.patch(
  '/:id',
  requireAuth(),
  requireRole([UserRole.ADMIN]),
  validate(updateAuthorSchema),
  controller.updateAuthor
);

router.delete(
  '/:id',
  requireAuth(),
  requireRole([UserRole.ADMIN]),
  controller.deleteAuthor
);

export default router;
