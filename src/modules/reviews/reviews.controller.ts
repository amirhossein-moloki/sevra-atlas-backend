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
}
