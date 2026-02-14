import { Request, Response } from 'express';
import { SalonsService } from './salons.service';
import { AuthRequest } from '../../shared/middlewares/auth.middleware';
import { getPagination, formatPaginatedResponse } from '../../shared/utils/pagination';
import { isAdmin } from '../../shared/auth/roles';
import { safeBigInt } from '../../shared/utils/bigint';

const salonsService = new SalonsService();

export class SalonsController {
  async getSalons(req: Request, res: Response) {
    const result = await salonsService.getSalons(req.query);
    res.json(result);
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
    const id = safeBigInt(req.params.id);
    const adminMode = isAdmin(req.user?.role);
    const result = await salonsService.updateSalon(
      id,
      req.body,
      req.user!.id,
      adminMode
    );
    res.json(result);
  }

  async deleteSalon(req: AuthRequest, res: Response) {
    const id = safeBigInt(req.params.id);
    const adminMode = isAdmin(req.user?.role);
    const result = await salonsService.deleteSalon(
      id,
      req.user!.id,
      adminMode
    );
    res.json(result);
  }

  async assignServices(req: AuthRequest, res: Response) {
    const id = safeBigInt(req.params.id);
    const adminMode = isAdmin(req.user?.role);
    const mode = (req.query.mode as 'append' | 'replace') || 'append';
    const result = await salonsService.assignServices(
      id,
      req.body.services,
      mode,
      req.user!.id,
      adminMode
    );
    res.json(result);
  }

  async removeService(req: AuthRequest, res: Response) {
    const id = safeBigInt(req.params.id);
    const serviceId = safeBigInt(req.params.serviceId, 'serviceId');
    const adminMode = isAdmin(req.user?.role);
    const result = await salonsService.removeService(
      id,
      serviceId,
      req.user!.id,
      adminMode
    );
    res.json(result);
  }

  async setAvatar(req: AuthRequest, res: Response) {
    const id = safeBigInt(req.params.id);
    const adminMode = isAdmin(req.user?.role);
    const result = await salonsService.attachMedia(
      id,
      { mediaId: req.body.mediaId },
      'AVATAR',
      req.user!.id,
      adminMode
    );
    res.json(result);
  }

  async setCover(req: AuthRequest, res: Response) {
    const id = safeBigInt(req.params.id);
    const adminMode = isAdmin(req.user?.role);
    const result = await salonsService.attachMedia(
      id,
      { mediaId: req.body.mediaId },
      'COVER',
      req.user!.id,
      adminMode
    );
    res.json(result);
  }

  async addGallery(req: AuthRequest, res: Response) {
    const id = safeBigInt(req.params.id);
    const adminMode = isAdmin(req.user?.role);
    const result = await salonsService.attachMedia(
      id,
      { mediaIds: req.body.mediaIds },
      'GALLERY',
      req.user!.id,
      adminMode
    );
    res.json(result);
  }

  async linkArtist(req: AuthRequest, res: Response) {
    const id = safeBigInt(req.params.id);
    const adminMode = isAdmin(req.user?.role);
    const result = await salonsService.linkArtist(
      id,
      req.body,
      req.user!.id,
      adminMode
    );
    res.json(result);
  }

  async unlinkArtist(req: AuthRequest, res: Response) {
    const id = safeBigInt(req.params.id);
    const artistId = safeBigInt(req.params.artistId, 'artistId');
    const adminMode = isAdmin(req.user?.role);
    const result = await salonsService.unlinkArtist(
      id,
      artistId,
      req.user!.id,
      adminMode
    );
    res.json(result);
  }
}
