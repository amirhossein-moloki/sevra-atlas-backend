import { Request, Response } from 'express';
import { ArtistsService } from './artists.service';
import { isAdmin } from '../../shared/auth/roles';
import { safeBigInt } from '../../shared/utils/bigint';
import { SubscriptionsService } from '../subscriptions/subscriptions.service';
import { EntityType } from '@prisma/client';
import { resolveId } from '../../shared/utils/resolver/idResolver';
import { runInBackground } from '../../shared/utils/background';
import { AuthRequest } from '../../shared/middlewares/auth.middleware';

const artistsService = new ArtistsService();
const subService = new SubscriptionsService();

export class ArtistsController {
  private resolveArtistId = async (identifier: string): Promise<bigint> => {
    return resolveId(identifier, (idOrSlug) => artistsService.findArtistByIdentifier(idOrSlug), 'Artist');
  };

  getArtists = async (req: Request, res: Response) => {
    const result = await artistsService.getArtists(req.query);
    res.json(result);
  };

  listSpecialties = async (req: Request, res: Response) => {
    const result = await artistsService.listSpecialties();
    res.json(result);
  };

  createSpecialty = async (req: Request, res: Response) => {
    const result = await artistsService.createSpecialty(req.body);
    res.status(201).json(result);
  };

  updateSpecialty = async (req: Request, res: Response) => {
    const id = safeBigInt(req.params.id);
    const result = await artistsService.updateSpecialty(id, req.body);
    res.json(result);
  };

  deleteSpecialty = async (req: Request, res: Response) => {
    const id = safeBigInt(req.params.id);
    const result = await artistsService.deleteSpecialty(id);
    res.json(result);
  };

  getArtist = async (req: Request, res: Response) => {
    const identifier = req.params.idOrSlug || req.params.slug;
    const result = await artistsService.getArtistBySlug(identifier);

    // Background click tracking
    runInBackground(
      subService.trackClick(EntityType.ARTIST, result.id, {
        planId: result.planId?.toString(),
        isFeatured: !!result.featuredUntil && result.featuredUntil > new Date(),
      }),
      'artist_click_tracking',
      { artistId: result.id.toString() }
    );

    res.json(result);
  };

  createArtist = async (req: AuthRequest, res: Response) => {
    const result = await artistsService.createArtist(req.body, req.user!.id);
    res.status(201).json(result);
  };

  updateArtist = async (req: AuthRequest, res: Response) => {
    const id = await this.resolveArtistId(req.params.idOrSlug || req.params.id);
    const adminMode = isAdmin(req.user?.role);
    const result = await artistsService.updateArtist(
      id,
      req.body,
      req.user!.id,
      adminMode
    );
    res.json(result);
  };

  deleteArtist = async (req: AuthRequest, res: Response) => {
    const id = await this.resolveArtistId(req.params.idOrSlug || req.params.id);
    const adminMode = isAdmin(req.user?.role);
    const result = await artistsService.deleteArtist(
      id,
      req.user!.id,
      adminMode
    );
    res.json(result);
  };

  setAvatar = async (req: AuthRequest, res: Response) => {
    const id = await this.resolveArtistId(req.params.idOrSlug || req.params.id);
    const adminMode = isAdmin(req.user?.role);
    const result = await artistsService.attachMedia(
      id,
      { mediaId: req.body.mediaId },
      'AVATAR',
      req.user!.id,
      adminMode
    );
    res.json(result);
  };

  setCover = async (req: AuthRequest, res: Response) => {
    const id = await this.resolveArtistId(req.params.idOrSlug || req.params.id);
    const adminMode = isAdmin(req.user?.role);
    const result = await artistsService.attachMedia(
      id,
      { mediaId: req.body.mediaId },
      'COVER',
      req.user!.id,
      adminMode
    );
    res.json(result);
  };

  addGallery = async (req: AuthRequest, res: Response) => {
    const id = await this.resolveArtistId(req.params.idOrSlug || req.params.id);
    const adminMode = isAdmin(req.user?.role);
    const result = await artistsService.attachMedia(
      id,
      { mediaIds: req.body.mediaIds },
      'GALLERY',
      req.user!.id,
      adminMode
    );
    res.json(result);
  };

  addCertification = async (req: AuthRequest, res: Response) => {
    const id = await this.resolveArtistId(req.params.idOrSlug || req.params.id);
    const adminMode = isAdmin(req.user?.role);
    const result = await artistsService.addCertification(
      id,
      req.body,
      req.user!.id,
      adminMode
    );
    res.status(201).json(result);
  };

  updateCertification = async (req: AuthRequest, res: Response) => {
    const certId = safeBigInt(req.params.certId, 'certId');
    const adminMode = isAdmin(req.user?.role);
    const result = await artistsService.updateCertification(
      certId,
      req.body,
      req.user!.id,
      adminMode
    );
    res.json(result);
  };

  deleteCertification = async (req: AuthRequest, res: Response) => {
    const certId = safeBigInt(req.params.certId, 'certId');
    const adminMode = isAdmin(req.user?.role);
    const result = await artistsService.deleteCertification(
      certId,
      req.user!.id,
      adminMode
    );
    res.json(result);
  };

  verifyCertification = async (req: AuthRequest, res: Response) => {
    const certId = safeBigInt(req.params.certId, 'certId');
    const result = await artistsService.verifyCertification(
      certId,
      req.body.isVerified,
      req.user!.id
    );
    res.json(result);
  };

  assignSpecialties = async (req: AuthRequest, res: Response) => {
    const id = await this.resolveArtistId(req.params.idOrSlug || req.params.id);
    const adminMode = isAdmin(req.user?.role);
    const mode = (req.body.mode as 'replace' | 'append') || 'replace';
    const result = await artistsService.assignSpecialties(
      id,
      req.body.specialtyIds,
      mode,
      req.user!.id,
      adminMode
    );
    res.json(result);
  };
}
