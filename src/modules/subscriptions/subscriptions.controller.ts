import { Request, Response } from 'express';
import { SubscriptionsService } from './subscriptions.service';
import { safeBigInt } from '../../shared/utils/bigint';
import { EntityType } from '@prisma/client';

const service = new SubscriptionsService();

export class SubscriptionsController {
  async getPlans(req: Request, res: Response) {
    const { entityType } = req.query;
    const plans = await service.listPlans(entityType as EntityType);
    res.json({ success: true, data: plans });
  }

  async assignPlan(req: Request, res: Response) {
    const { targetType, targetId, planId, notes } = req.body;
    const adminId = req.user?.id ? BigInt(req.user.id) : undefined;
    const subscription = await service.assignPlan(
      targetType as 'SALON' | 'ARTIST',
      safeBigInt(targetId, 'targetId'),
      safeBigInt(planId, 'planId'),
      notes,
      adminId
    );
    res.json({ success: true, data: subscription });
  }

  async suspendSubscription(req: Request, res: Response) {
    const { targetType, targetId } = req.body;
    const sub = await service.suspendSubscription(
      targetType as 'SALON' | 'ARTIST',
      safeBigInt(targetId, 'targetId')
    );
    res.json({ success: true, data: sub });
  }

  async overrideScore(req: Request, res: Response) {
    const { targetType, targetId, score } = req.body;
    const result = await service.overrideVisibilityScore(
      targetType as 'SALON' | 'ARTIST',
      safeBigInt(targetId, 'targetId'),
      parseFloat(score)
    );
    res.json({ success: true, data: result });
  }

  async getStats(req: Request, res: Response) {
    const stats = await service.getRevenueStats();
    res.json({ success: true, data: stats });
  }

  async getAnalytics(req: Request, res: Response) {
    const analytics = await service.getAnalytics();
    res.json({ success: true, data: analytics });
  }

  async exportBilling(req: Request, res: Response) {
    const data = await service.exportBillingData();
    res.json({ success: true, data });
  }

  async runExpirationCheck(req: Request, res: Response) {
    const count = await service.checkExpirations();
    res.json({ success: true, data: { processedCount: count } });
  }
}
