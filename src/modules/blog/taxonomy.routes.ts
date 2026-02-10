import { Router } from 'express';
import { BlogTaxonomyController } from './taxonomy.controller';
import { requireAuth, requireRole } from '../../../shared/middlewares/auth.middleware';
import { UserRole } from '@prisma/client';

const router = Router();
const controller = new BlogTaxonomyController();

router.get('/categories', controller.listCategories);
router.post('/categories', requireAuth(), requireRole([UserRole.ADMIN]), controller.createCategory);

router.get('/tags', controller.listTags);
router.post('/tags', requireAuth(), requireRole([UserRole.ADMIN]), controller.createTag);

export default router;
