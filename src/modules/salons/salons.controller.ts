import { Request, Response } from 'express';
import { SalonsService } from './salons.service';
import { AuthRequest } from '../../shared/middlewares/auth.middleware';
import { ApiError } from '../../shared/errors/ApiError';
import { isAdmin } from '../../shared/auth/roles';
import { safeBigInt } from '../../shared/utils/bigint';
import { SubscriptionsService } from '../subscriptions/subscriptions.service';
import { EntityType } from '@prisma/client';
import { runInBackground } from '../../shared/utils/background';
import { resolveId } from '../../shared/utils/resolver/idResolver';

const salonsService = new SalonsService();
const subService = new SubscriptionsService();

export class SalonsController {
  private resolveSalonId = async (identifier: string): Promise<bigint> => {
    return resolveId(identifier, (idOrSlug) => salonsService.findSalonByIdentifier(idOrSlug), 'Salon');
  };

  getSalons = async (req: Request, res: Response) => {
    const result = await salonsService.getSalons(req.query);
    res.json(result);
  };

  getSalon = async (req: Request, res: Response) => {
    const result = await salonsService.getSalonBySlug(req.params.idOrSlug || req.params.slug);

    // Background click tracking
    runInBackground(
      subService.trackClick(EntityType.SALON, result.id, {
        planId: result.planId?.toString(),
        isFeatured: !!result.featuredUntil && result.featuredUntil > new Date(),
      }),
      'salon_click_tracking',
      { salonId: result.id.toString() }
    );

    res.json(result);
  };

  createSalon = async (req: AuthRequest, res: Response) => {
    const result = await salonsService.createSalon(req.body, req.user!.id);
    res.status(201).json(result);
  };

  updateSalon = async (req: AuthRequest, res: Response) => {
    const id = await this.resolveSalonId(req.params.idOrSlug || req.params.id);
    const adminMode = isAdmin(req.user?.role);
    const result = await salonsService.updateSalon(
      id,
      req.body,
      req.user!.id,
      adminMode
    );
    res.json(result);
  }

  deleteSalon = async (req: AuthRequest, res: Response) => {
    const id = await this.resolveSalonId(req.params.idOrSlug || req.params.id);
    const adminMode = isAdmin(req.user?.role);
    const result = await salonsService.deleteSalon(
      id,
      req.user!.id,
      adminMode
    );
    res.json(result);
  };

  assignServices = async (req: AuthRequest, res: Response) => {
    const id = await this.resolveSalonId(req.params.idOrSlug || req.params.id);
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
  };

  removeService = async (req: AuthRequest, res: Response) => {
    const id = await this.resolveSalonId(req.params.idOrSlug || req.params.id);
    const serviceId = safeBigInt(req.params.serviceId, 'serviceId');
    const adminMode = isAdmin(req.user?.role);
    const result = await salonsService.removeService(
      id,
      serviceId,
      req.user!.id,
      adminMode
    );
    res.json(result);
  };

  setAvatar = async (req: AuthRequest, res: Response) => {
    const id = await this.resolveSalonId(req.params.idOrSlug || req.params.id);
    const adminMode = isAdmin(req.user?.role);
    const result = await salonsService.attachMedia(
      id,
      { mediaId: req.body.mediaId },
      'AVATAR',
      req.user!.id,
      adminMode
    );
    res.json(result);
  };

  setCover = async (req: AuthRequest, res: Response) => {
    const id = await this.resolveSalonId(req.params.idOrSlug || req.params.id);
    const adminMode = isAdmin(req.user?.role);
    const result = await salonsService.attachMedia(
      id,
      { mediaId: req.body.mediaId },
      'COVER',
      req.user!.id,
      adminMode
    );
    res.json(result);
  };

  addGallery = async (req: AuthRequest, res: Response) => {
    const id = await this.resolveSalonId(req.params.idOrSlug || req.params.id);
    const adminMode = isAdmin(req.user?.role);
    const result = await salonsService.attachMedia(
      id,
      { mediaIds: req.body.mediaIds },
      'GALLERY',
      req.user!.id,
      adminMode
    );
    res.json(result);
  };

  linkArtist = async (req: AuthRequest, res: Response) => {
    const id = await this.resolveSalonId(req.params.idOrSlug || req.params.id);
    const adminMode = isAdmin(req.user?.role);
    const result = await salonsService.linkArtist(
      id,
      req.body,
      req.user!.id,
      adminMode
    );
    res.json(result);
  };

  unlinkArtist = async (req: AuthRequest, res: Response) => {
    const id = await this.resolveSalonId(req.params.idOrSlug || req.params.id);
    const artistId = safeBigInt(req.params.artistId, 'artistId');
    const adminMode = isAdmin(req.user?.role);
    const result = await salonsService.unlinkArtist(
      id,
      artistId,
      req.user!.id,
      adminMode
    );
    res.json(result);
  };
}
