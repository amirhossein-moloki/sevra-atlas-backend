import { Router } from 'express';
import authRoutes from './modules/auth/auth.routes';
import geoRoutes from './modules/geo/geo.routes';
import mediaRoutes from './modules/media/media.routes';
import seoRoutes from './modules/seo/seo.routes';
import salonRoutes from './modules/salons/salons.routes';
import blogPostRoutes from './modules/blog/posts/posts.routes';
import reviewRoutes from './modules/reviews/reviews.routes';
import followRoutes from './modules/follows/follows.routes';
import verificationRoutes from './modules/verification/verification.routes';

const router = Router();

router.use('/auth', authRoutes);
router.use('/geo', geoRoutes);
router.use('/media', mediaRoutes);
router.use('/seo', seoRoutes);
router.use('/salons', salonRoutes);
router.use('/blog/posts', blogPostRoutes);
router.use('/reviews', reviewRoutes);
router.use('/follows', followRoutes);
router.use('/verification', verificationRoutes);

// Other blog modules can be added here
// router.use('/blog/categories', blogCategoryRoutes);

export default router;
