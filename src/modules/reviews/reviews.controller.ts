import { Response } from 'express';
import { ReviewsService } from './reviews.service';
import { AuthRequest } from '../../shared/middlewares/auth.middleware';
import { isStaff } from '../../shared/auth/roles';
import { safeBigInt } from '../../shared/utils/bigint';

const reviewsService = new ReviewsService();

export class ReviewsController {
  async createReview(req: AuthRequest, res: Response) {
    const result = await reviewsService.createReview(req.body, req.user!.id);
    res.status(201).json(result);
  }

  async voteReview(req: AuthRequest, res: Response) {
    const id = safeBigInt(req.params.id);
    const result = await reviewsService.voteReview(
      id,
      req.user!.id,
      req.body.isLike
    );
    res.json(result);
  }

  async getSalonReviews(req: AuthRequest, res: Response) {
    const identifier = req.params.idOrSlug || req.params.slug;
    const result = await reviewsService.getReviews('SALON', identifier, req.query);
    res.json(result);
  }

  async getArtistReviews(req: AuthRequest, res: Response) {
    const identifier = req.params.idOrSlug || req.params.slug;
    const result = await reviewsService.getReviews('ARTIST', identifier, req.query);
    res.json(result);
  }

  async deleteReview(req: AuthRequest, res: Response) {
    const id = safeBigInt(req.params.id);
    const adminMode = isStaff(req.user?.role);
    const result = await reviewsService.deleteReview(id, req.user!.id, adminMode);
    res.json(result);
  }
}
