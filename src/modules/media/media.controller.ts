import { Request, Response } from 'express';
import { MediaService } from './media.service';
import { AuthRequest } from '../../shared/middlewares/auth.middleware';
import { isAdmin } from '../../shared/auth/roles';

const mediaService = new MediaService();

export class MediaController {
  async listMedia(req: AuthRequest, res: Response) {
    const result = await mediaService.listMedia(req.query);
    res.json(result);
  }

  async createMedia(req: AuthRequest, res: Response) {
    const result = await mediaService.createMedia(req.body, req.user!.id);
    res.status(201).json(result);
  }

  async uploadAndOptimize(req: AuthRequest, res: Response) {
    if (!req.file) {
      throw new Error('No file uploaded');
    }
    const result = await mediaService.uploadAndOptimize(req.file, req.user!.id);
    res.status(202).json(result); // Return 202 Accepted
  }

  async getMedia(req: AuthRequest, res: Response) {
    const result = await mediaService.getMedia(BigInt(req.params.id));
    res.json(result);
  }

  async getMediaStatus(req: AuthRequest, res: Response) {
    const media = await mediaService.getMedia(BigInt(req.params.id));
    res.json({
      mediaId: media.id.toString(),
      status: media.status,
      hasVariants: !!(media.variants && Object.keys(media.variants as object).length > 0),
    });
  }

  async updateMedia(req: AuthRequest, res: Response) {
    const adminMode = isAdmin(req.user?.role);
    const result = await mediaService.updateMedia(BigInt(req.params.id), req.body, req.user!.id, adminMode);
    res.json(result);
  }

  async downloadMedia(req: Request, res: Response) {
    const media = await mediaService.getMedia(BigInt(req.params.id));
    // In a real app, you'd stream from storage. For now, redirect to URL.
    res.redirect(media.url);
  }

  async deleteMedia(req: AuthRequest, res: Response) {
    const adminMode = isAdmin(req.user?.role);
    const result = await mediaService.deleteMedia(BigInt(req.params.id), req.user!.id, adminMode);
    res.json(result);
  }
}
