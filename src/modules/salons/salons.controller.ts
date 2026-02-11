import { Request, Response } from 'express';
import { SalonsService } from './salons.service';
import { AuthRequest } from '../../shared/middlewares/auth.middleware';
import { getPagination, formatPaginatedResponse } from '../../shared/utils/pagination';
import { isAdmin } from '../../shared/auth/roles';

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
    const adminMode = isAdmin(req.user?.role);
    const result = await salonsService.updateSalon(
      BigInt(req.params.id),
      req.body,
      req.user!.id,
      adminMode
    );
    res.json(result);
  }

  async deleteSalon(req: AuthRequest, res: Response) {
    const adminMode = isAdmin(req.user?.role);
    const result = await salonsService.deleteSalon(
      BigInt(req.params.id),
      req.user!.id,
      adminMode
    );
    res.json(result);
  }

  async assignServices(req: AuthRequest, res: Response) {
    const adminMode = isAdmin(req.user?.role);
    const mode = (req.query.mode as 'append' | 'replace') || 'append';
    const result = await salonsService.assignServices(
      BigInt(req.params.id),
      req.body.services,
      mode,
      req.user!.id,
      adminMode
    );
    res.json(result);
  }

  async removeService(req: AuthRequest, res: Response) {
    const adminMode = isAdmin(req.user?.role);
    const result = await salonsService.removeService(
      BigInt(req.params.id),
      BigInt(req.params.serviceId),
      req.user!.id,
      adminMode
    );
    res.json(result);
  }

  async setAvatar(req: AuthRequest, res: Response) {
    const adminMode = isAdmin(req.user?.role);
    const result = await salonsService.attachMedia(
      BigInt(req.params.id),
      { mediaId: req.body.mediaId, mediaData: req.body.media },
      'AVATAR',
      req.user!.id,
      adminMode
    );
    res.json(result);
  }

  async setCover(req: AuthRequest, res: Response) {
    const adminMode = isAdmin(req.user?.role);
    const result = await salonsService.attachMedia(
      BigInt(req.params.id),
      { mediaId: req.body.mediaId, mediaData: req.body.media },
      'COVER',
      req.user!.id,
      adminMode
    );
    res.json(result);
  }

  async addGallery(req: AuthRequest, res: Response) {
    const adminMode = isAdmin(req.user?.role);
    const result = await salonsService.attachMedia(
      BigInt(req.params.id),
      { mediaIds: req.body.mediaIds, mediaData: req.body.media },
      'GALLERY',
      req.user!.id,
      adminMode
    );
    res.json(result);
  }

  async linkArtist(req: AuthRequest, res: Response) {
    const adminMode = isAdmin(req.user?.role);
    const result = await salonsService.linkArtist(
      BigInt(req.params.id),
      req.body,
      req.user!.id,
      adminMode
    );
    res.json(result);
  }

  async unlinkArtist(req: AuthRequest, res: Response) {
    const adminMode = isAdmin(req.user?.role);
    const result = await salonsService.unlinkArtist(
      BigInt(req.params.id),
      BigInt(req.params.artistId),
      req.user!.id,
      adminMode
    );
    res.json(result);
  }
}
