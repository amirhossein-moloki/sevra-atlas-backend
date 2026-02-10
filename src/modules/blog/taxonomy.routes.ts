import { Router } from 'express';
import { BlogTaxonomyController } from './taxonomy.controller';
import { requireAuth, requireRole } from '../../../shared/middlewares/auth.middleware';
import { UserRole } from '@prisma/client';

const router = Router();
const controller = new BlogTaxonomyController();

router.get('/categories', controller.listCategories);
router.post('/categories', requireAuth(), requireRole([UserRole.ADMIN]), controller.createCategory);
router.get('/categories/:id', controller.getCategory);
router.patch('/categories/:id', requireAuth(), requireRole([UserRole.ADMIN]), controller.updateCategory);
router.delete('/categories/:id', requireAuth(), requireRole([UserRole.ADMIN]), controller.deleteCategory);

router.get('/tags', controller.listTags);
router.post('/tags', requireAuth(), requireRole([UserRole.ADMIN]), controller.createTag);
router.get('/tags/:id', controller.getTag);
router.patch('/tags/:id', requireAuth(), requireRole([UserRole.ADMIN]), controller.updateTag);
router.delete('/tags/:id', requireAuth(), requireRole([UserRole.ADMIN]), controller.deleteTag);

router.get('/series', controller.listSeries);
router.post('/series', requireAuth(), requireRole([UserRole.ADMIN]), controller.createSeries);
router.get('/series/:id', controller.getSeries);
router.patch('/series/:id', requireAuth(), requireRole([UserRole.ADMIN]), controller.updateSeries);
router.delete('/series/:id', requireAuth(), requireRole([UserRole.ADMIN]), controller.deleteSeries);

export default router;
