import { Request, Response } from 'express';
import { GrowthService } from './growth.service';

const service = new GrowthService();

export class GrowthController {
  async createInvite(req: Request, res: Response) {
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ success: false, message: 'Unauthorized' });

    const { maxUses, expiresDays } = req.body;
    const invite = await service.createInvite(BigInt(userId), maxUses, expiresDays);
    res.json({ success: true, data: invite });
  }

  async getMyStats(req: Request, res: Response) {
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ success: false, message: 'Unauthorized' });

    const stats = await service.getInviterStats(BigInt(userId));
    res.json({ success: true, data: stats });
  }
}
