import { Request, Response } from 'express';
import { SalonsService } from './salons.service';
import { AuthRequest } from '../../shared/middlewares/auth.middleware';
import { getPagination, formatPaginatedResponse } from '../../shared/utils/pagination';
import { UserRole } from '@prisma/client';

const salonsService = new SalonsService();

export class SalonsController {
  async getSalons(req: Request, res: Response) {
    const pagination = getPagination(req.query);
    const { data, total } = await salonsService.getSalons({
      ...req.query,
      ...pagination,
    });
    res.json(formatPaginatedResponse(data, total, pagination));
  }

  async getSalon(req: Request, res: Response) {
    const result = await salonsService.getSalonBySlug(req.params.slug);
    res.json(result);
  }

  async createSalon(req: AuthRequest, res: Response) {
    const result = await salonsService.createSalon(req.body, req.user!.id);
    res.status(201).json(result);
  }

  async updateSalon(req: AuthRequest, res: Response) {
    const isAdmin = req.user!.role === UserRole.ADMIN;
    const result = await salonsService.updateSalon(
      BigInt(req.params.id),
      req.body,
      req.user!.id,
      isAdmin
    );
    res.json(result);
  }
}
