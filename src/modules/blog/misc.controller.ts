import { Request, Response } from 'express';
import { BlogMiscService } from './misc.service';
import { AuthRequest } from '../../shared/middlewares/auth.middleware';
import { MenuLocation } from '@prisma/client';

const blogMiscService = new BlogMiscService();

export class BlogMiscController {
  async listRevisions(req: Request, res: Response) {
    const result = await blogMiscService.listRevisions(req.params.postId);
    res.json({ data: result });
  }

  async addReaction(req: AuthRequest, res: Response) {
    const result = await blogMiscService.addReaction(req.user!.id, req.body);
    res.status(201).json(result);
  }

  async listPages(req: Request, res: Response) {
    const result = await blogMiscService.listPages();
    res.json({ data: result });
  }

  async getPage(req: Request, res: Response) {
    const result = await blogMiscService.getPage(req.params.slug);
    res.json(result);
  }

  async getMenu(req: Request, res: Response) {
    const result = await blogMiscService.getMenu(req.params.location as MenuLocation);
    res.json(result);
  }
}
