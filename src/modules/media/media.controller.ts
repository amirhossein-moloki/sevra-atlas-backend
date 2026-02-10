import { Request, Response } from 'express';
import { MediaService } from './media.service';
import { AuthRequest } from '../../shared/middlewares/auth.middleware';

const mediaService = new MediaService();

import { UserRole } from '@prisma/client';

export class MediaController {
  async listMedia(req: AuthRequest, res: Response) {
    const result = await mediaService.listMedia(req.query);
    res.json(result);
  }

  async createMedia(req: AuthRequest, res: Response) {
    const result = await mediaService.createMedia(req.body, req.user!.id);
    res.status(201).json(result);
  }

  async getMedia(req: AuthRequest, res: Response) {
    const result = await mediaService.getMedia(BigInt(req.params.id));
    res.json(result);
  }

  async downloadMedia(req: Request, res: Response) {
    const media = await mediaService.getMedia(BigInt(req.params.id));
    // In a real app, you'd stream from storage. For now, redirect to URL.
    res.redirect(media.url);
  }

  async deleteMedia(req: AuthRequest, res: Response) {
    const isAdmin = req.user!.role === UserRole.ADMIN;
    const result = await mediaService.deleteMedia(BigInt(req.params.id), req.user!.id, isAdmin);
    res.json(result);
  }
}
