import { Request, Response } from 'express';
import { BlogCommentsService } from './comments.service';
import { AuthRequest } from '../../../shared/middlewares/auth.middleware';
import { UserRole } from '@prisma/client';

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

  async listGlobalComments(req: AuthRequest, res: Response) {
    const isAdmin = req.user?.role === UserRole.ADMIN;
    const result = await commentsService.listGlobalComments(req.query, isAdmin);
    res.json(result);
  }

  async updateCommentStatus(req: AuthRequest, res: Response) {
    const result = await commentsService.updateCommentStatus(BigInt(req.params.id), req.body.status);
    res.json(result);
  }

  async deleteComment(req: AuthRequest, res: Response) {
    const result = await commentsService.deleteComment(BigInt(req.params.id));
    res.json(result);
  }
}
