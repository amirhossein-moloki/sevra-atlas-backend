import { Request, Response } from 'express';
import { AdminService } from './admin.service';

const adminService = new AdminService();

export class AdminController {
  async getDashboard(req: Request, res: Response) {
    const result = await adminService.getDashboardSummary();
    res.json(result);
  }

  async getStats(req: Request, res: Response) {
    const { from, to } = req.query;
    const result = await adminService.getStats(from as string, to as string);
    res.json(result);
  }
}
