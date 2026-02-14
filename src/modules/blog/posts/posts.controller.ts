import { Request, Response } from 'express';
import { PostsService } from './posts.service';
import { AuthRequest } from '../../../shared/middlewares/auth.middleware';

const postsService = new PostsService();

export class PostsController {
  async listPosts(req: Request, res: Response) {
    const result = await postsService.listPosts(req.query, (req as any).user);
    res.json(result);
  }

  async getPost(req: Request, res: Response) {
    const result = await postsService.getPostBySlug(req.params.slug, (req as any).user);
    res.json(result);
  }

  async createPost(req: AuthRequest, res: Response) {
    const isAdminUser = req.user?.role === 'ADMIN';
    const result = await postsService.createPost(req.body, req.user!.id, isAdminUser);
    res.status(201).json(result);
  }

  async updatePost(req: AuthRequest, res: Response) {
    const result = await postsService.updatePost(req.params.slug, req.body, req.user);
    res.json(result);
  }

  async deletePost(req: AuthRequest, res: Response) {
    const result = await postsService.deletePost(req.params.slug, req.user);
    res.json(result);
  }

  async getSimilarPosts(req: Request, res: Response) {
    const result = await postsService.getSimilarPosts(req.params.slug);
    res.json(result);
  }

  async getSameCategoryPosts(req: Request, res: Response) {
    const result = await postsService.getSameCategoryPosts(req.params.slug, req.query);
    res.json(result);
  }

  async getRelatedPosts(req: Request, res: Response) {
    const result = await postsService.getRelatedPosts(req.params.slug);
    res.json(result);
  }

  async publishPost(req: AuthRequest, res: Response) {
    const result = await postsService.publishPost(req.params.slug, req.user);
    res.json(result);
  }
}
