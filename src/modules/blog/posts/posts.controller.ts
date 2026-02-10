import { Request, Response } from 'express';
import { PostsService } from './posts.service';
import { AuthRequest } from '../../../shared/middlewares/auth.middleware';
import { getPagination, formatPaginatedResponse } from '../../../shared/utils/pagination';
import { UserRole } from '@prisma/client';

const postsService = new PostsService();

export class PostsController {
  async getPosts(req: Request, res: Response) {
    const pagination = getPagination(req.query);
    const { data, total } = await postsService.getPosts({
      ...req.query,
      ...pagination,
    });
    res.json(formatPaginatedResponse(data, total, pagination));
  }

  async getPost(req: Request, res: Response) {
    const result = await postsService.getPostBySlug(req.params.slug);
    res.json(result);
  }

  async createPost(req: AuthRequest, res: Response) {
    const result = await postsService.createPost(req.body, req.user!.id);
    res.status(201).json(result);
  }

  async updatePost(req: AuthRequest, res: Response) {
    const isAdmin = req.user!.role === UserRole.ADMIN;
    const result = await postsService.updatePost(
      BigInt(req.params.id),
      req.body,
      req.user!.id,
      isAdmin
    );
    res.json(result);
  }

  async publishPost(req: AuthRequest, res: Response) {
    const result = await postsService.publishPost(BigInt(req.params.id));
    res.json(result);
  }
}
