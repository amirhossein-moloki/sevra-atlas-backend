import { Response } from 'express';
import { MediaService } from './media.service';
import { AuthRequest } from '../../shared/middlewares/auth.middleware';

const mediaService = new MediaService();

export class MediaController {
  async createMedia(req: AuthRequest, res: Response) {
    const result = await mediaService.createMedia(req.body, req.user!.id);
    res.status(201).json(result);
  }

  async getMedia(req: AuthRequest, res: Response) {
    const result = await mediaService.getMedia(BigInt(req.params.id));
    res.json(result);
  }
}
