import { Response } from 'express';
import { ReportsService } from './reports.service';
import { AuthRequest } from '../../shared/middlewares/auth.middleware';
import { ReportStatus } from '@prisma/client';
import { safeBigInt } from '../../shared/utils/bigint';

const reportsService = new ReportsService();

export class ReportsController {
  async createReport(req: AuthRequest, res: Response) {
    const result = await reportsService.createReport(req.user!.id, req.body);
    res.status(201).json(result);
  }

  async listReports(req: AuthRequest, res: Response) {
    const result = await reportsService.listReports(req.query);
    res.json(result);
  }

  async updateStatus(req: AuthRequest, res: Response) {
    const id = safeBigInt(req.params.id);
    const result = await reportsService.updateReportStatus(id, req.body.status as ReportStatus);
    res.json(result);
  }
}
