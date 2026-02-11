import { Router } from 'express';
import { BlogTaxonomyController } from './taxonomy.controller';
import { requireAuth, requireAdmin } from '../../shared/middlewares/auth.middleware';
import { validate } from '../../shared/middlewares/validate.middleware';
import {
  createCategorySchema,
  updateCategorySchema,
  createTagSchema,
  updateTagSchema,
  createSeriesSchema,
  updateSeriesSchema,
} from './taxonomy.validators';

const router = Router();
const controller = new BlogTaxonomyController();

router.get('/categories', controller.listCategories);
router.post(
  '/categories',
  requireAuth(),
  requireAdmin(),
  validate(createCategorySchema),
  controller.createCategory
);
router.get('/categories/:id', controller.getCategory);
router.patch(
  '/categories/:id',
  requireAuth(),
  requireAdmin(),
  validate(updateCategorySchema),
  controller.updateCategory
);
router.delete('/categories/:id', requireAuth(), requireAdmin(), controller.deleteCategory);

router.get('/tags', controller.listTags);
router.post(
  '/tags',
  requireAuth(),
  requireAdmin(),
  validate(createTagSchema),
  controller.createTag
);
router.get('/tags/:id', controller.getTag);
router.patch(
  '/tags/:id',
  requireAuth(),
  requireAdmin(),
  validate(updateTagSchema),
  controller.updateTag
);
router.delete('/tags/:id', requireAuth(), requireAdmin(), controller.deleteTag);

router.get('/series', controller.listSeries);
router.post(
  '/series',
  requireAuth(),
  requireAdmin(),
  validate(createSeriesSchema),
  controller.createSeries
);
router.get('/series/:id', controller.getSeries);
router.patch(
  '/series/:id',
  requireAuth(),
  requireAdmin(),
  validate(updateSeriesSchema),
  controller.updateSeries
);
router.delete('/series/:id', requireAuth(), requireAdmin(), controller.deleteSeries);

export default router;
