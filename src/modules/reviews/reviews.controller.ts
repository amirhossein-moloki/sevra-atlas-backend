import { Response } from 'express';
import { ReviewsService } from './reviews.service';
import { AuthRequest } from '../../shared/middlewares/auth.middleware';

const reviewsService = new ReviewsService();

export class ReviewsController {
  async createReview(req: AuthRequest, res: Response) {
    const result = await reviewsService.createReview(req.body, req.user!.id);
    res.status(201).json(result);
  }

  async voteReview(req: AuthRequest, res: Response) {
    const result = await reviewsService.voteReview(
      BigInt(req.params.id),
      req.user!.id,
      req.body.isLike
    );
    res.json(result);
  }

  async getSalonReviews(req: AuthRequest, res: Response) {
    const result = await reviewsService.getReviews('SALON', req.params.slug, req.query);
    res.json(result);
  }

  async getArtistReviews(req: AuthRequest, res: Response) {
    const result = await reviewsService.getReviews('ARTIST', req.params.slug, req.query);
    res.json(result);
  }

  async deleteReview(req: AuthRequest, res: Response) {
    const isAdmin = (req as any).user.role === 'ADMIN' || (req as any).user.role === 'MODERATOR';
    const result = await reviewsService.deleteReview(BigInt(req.params.id), req.user!.id, isAdmin);
    res.json(result);
  }
}
