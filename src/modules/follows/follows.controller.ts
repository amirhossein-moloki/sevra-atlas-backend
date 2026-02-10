import { Response } from 'express';
import { FollowsService } from './follows.service';
import { AuthRequest } from '../../shared/middlewares/auth.middleware';
import { FollowTargetType } from '@prisma/client';

const followsService = new FollowsService();

export class FollowsController {
  async follow(req: AuthRequest, res: Response) {
    const { targetType, targetId } = req.body;
    const result = await followsService.follow(req.user!.id, targetType as FollowTargetType, BigInt(targetId));
    res.json(result);
  }

  async unfollow(req: AuthRequest, res: Response) {
    const { targetType, targetId } = req.body;
    const result = await followsService.unfollow(req.user!.id, targetType as FollowTargetType, BigInt(targetId));
    res.json(result);
  }

  async getMyFollows(req: AuthRequest, res: Response) {
    const result = await followsService.getMyFollows(req.user!.id);
    res.json({ data: result });
  }
}
