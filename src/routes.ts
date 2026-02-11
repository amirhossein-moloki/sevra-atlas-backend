import { Router } from 'express';
import authRoutes from './modules/auth/auth.routes';
import usersRoutes from './modules/users/users.routes';
import geoRoutes from './modules/geo/geo.routes';
import servicesRoutes from './modules/services/services.routes';
import mediaRoutes from './modules/media/media.routes';
import seoRoutes from './modules/seo/seo.routes';
import salonRoutes from './modules/salons/salons.routes';
import artistRoutes from './modules/artists/artists.routes';
import specialtyRoutes from './modules/artists/specialties.routes';
import { ArtistsController } from './modules/artists/artists.controller';
import { SearchController } from './modules/services/search.controller';
import blogPostRoutes from './modules/blog/posts/posts.routes';
import reviewRoutes from './modules/reviews/reviews.routes';
import followRoutes from './modules/follows/follows.routes';
import saveRoutes from './modules/saves/saves.routes';
import reportRoutes from './modules/reports/reports.routes';
import verificationRoutes from './modules/verification/verification.routes';
import adminRoutes from './modules/admin/admin.routes';
import healthRoutes from './modules/health/health.routes';

const router = Router();

const artistsController = new ArtistsController();
const searchController = new SearchController();

router.get('/search', searchController.search);
router.use('/auth', authRoutes);
router.use('/', usersRoutes);
router.use('/geo', geoRoutes);
router.use('/services', servicesRoutes);
router.use('/media', mediaRoutes);
router.use('/seo', seoRoutes);
router.use('/salons', salonRoutes);
router.use('/artists', artistRoutes);
router.use('/specialties', specialtyRoutes);
router.use('/blog/posts', blogPostRoutes);
router.use('/reviews', reviewRoutes);
router.use('/follow', followRoutes);
router.use('/save', saveRoutes);
router.use('/reports', reportRoutes);
router.use('/verification', verificationRoutes);
router.use('/admin', adminRoutes);
router.use('/health', healthRoutes);

import blogTaxonomyRoutes from './modules/blog/taxonomy.routes';
import blogMiscRoutes from './modules/blog/misc.routes';
import blogAuthorsRoutes from './modules/blog/authors/authors.routes';
import blogCommentsRoutes from './modules/blog/comments/comments.routes';

// Other blog modules
router.use('/blog/taxonomy', blogTaxonomyRoutes);
router.use('/blog/misc', blogMiscRoutes);
router.use('/blog/authors', blogAuthorsRoutes);
router.use('/blog/comments', blogCommentsRoutes);

export default router;
