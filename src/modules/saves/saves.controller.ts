import { Response } from 'express';
import { SavesService } from './saves.service';
import { AuthRequest } from '../../shared/middlewares/auth.middleware';
import { SaveTargetType } from '@prisma/client';

const savesService = new SavesService();

export class SavesController {
  async save(req: AuthRequest, res: Response) {
    const { targetType, targetId } = req.body;
    const result = await savesService.save(req.user!.id, targetType as SaveTargetType, BigInt(targetId));
    res.json(result);
  }

  async unsave(req: AuthRequest, res: Response) {
    const { targetType, targetId } = req.body;
    const result = await savesService.unsave(req.user!.id, targetType as SaveTargetType, BigInt(targetId));
    res.json(result);
  }

  async getMySaves(req: AuthRequest, res: Response) {
    const result = await savesService.getMySaves(req.user!.id);
    res.json({ data: result });
  }
}
