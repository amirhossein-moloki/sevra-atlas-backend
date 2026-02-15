import { Request, Response } from 'express';
import { BlogMiscService } from './misc.service';
import { AuthRequest } from '../../shared/middlewares/auth.middleware';
import { MenuLocation } from '@prisma/client';
import { safeBigInt } from '../../shared/utils/bigint';

const blogMiscService = new BlogMiscService();

export class BlogMiscController {
  async listRevisions(req: Request, res: Response) {
    const result = await blogMiscService.listRevisions(req.params.postId);
    res.json(result);
  }

  async addReaction(req: AuthRequest, res: Response) {
    const result = await blogMiscService.addReaction(req.user!.id, req.body);
    res.status(201).json(result);
  }

  async listPages(req: Request, res: Response) {
    const result = await blogMiscService.listPages();
    res.json(result);
  }

  async getPage(req: Request, res: Response) {
    const result = await blogMiscService.getPage(req.params.slug);
    res.json(result);
  }

  async getMenu(req: Request, res: Response) {
    const result = await blogMiscService.getMenu(req.params.location as MenuLocation);
    res.json(result);
  }

  async createPage(req: Request, res: Response) {
    const result = await blogMiscService.createPage(req.body);
    res.status(201).json(result);
  }

  async updatePage(req: Request, res: Response) {
    const id = safeBigInt(req.params.id);
    const result = await blogMiscService.updatePage(id, req.body);
    res.json(result);
  }

  async deletePage(req: Request, res: Response) {
    const id = safeBigInt(req.params.id);
    const result = await blogMiscService.deletePage(id);
    res.json(result);
  }

  async createMenu(req: Request, res: Response) {
    const result = await blogMiscService.createMenu(req.body);
    res.status(201).json(result);
  }

  async updateMenu(req: Request, res: Response) {
    const id = safeBigInt(req.params.id);
    const result = await blogMiscService.updateMenu(id, req.body);
    res.json(result);
  }

  async deleteMenu(req: Request, res: Response) {
    const id = safeBigInt(req.params.id);
    const result = await blogMiscService.deleteMenu(id);
    res.json(result);
  }

  async createMenuItem(req: Request, res: Response) {
    const result = await blogMiscService.createMenuItem(req.body);
    res.status(201).json(result);
  }

  async updateMenuItem(req: Request, res: Response) {
    const id = safeBigInt(req.params.id);
    const result = await blogMiscService.updateMenuItem(id, req.body);
    res.json(result);
  }

  async deleteMenuItem(req: Request, res: Response) {
    const id = safeBigInt(req.params.id);
    const result = await blogMiscService.deleteMenuItem(id);
    res.json(result);
  }
}
