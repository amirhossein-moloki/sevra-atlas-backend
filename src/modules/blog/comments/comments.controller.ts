import { Request, Response } from 'express';
import { BlogCommentsService } from './comments.service';
import { AuthRequest } from '../../../shared/middlewares/auth.middleware';

const commentsService = new BlogCommentsService();

export class BlogCommentsController {
  async listPostComments(req: Request, res: Response) {
    const result = await commentsService.listPostComments(req.params.slug, req.query);
    res.json(result);
  }

  async createComment(req: AuthRequest, res: Response) {
    const result = await commentsService.createComment(req.params.slug, req.user!.id, req.body);
    res.status(201).json(result);
  }
}
