import { Request, Response } from 'express';
import { ArtistsService } from './artists.service';
import { isAdmin } from '../../shared/auth/roles';
import { safeBigInt } from '../../shared/utils/bigint';
import { SubscriptionsService } from '../subscriptions/subscriptions.service';
import { EntityType } from '@prisma/client';

const artistsService = new ArtistsService();
const subService = new SubscriptionsService();

export class ArtistsController {
  async getArtists(req: Request, res: Response) {
    const result = await artistsService.getArtists(req.query);
    res.json(result);
  }

  async listSpecialties(req: Request, res: Response) {
    const result = await artistsService.listSpecialties();
    res.json(result);
  }

  async createSpecialty(req: Request, res: Response) {
    const result = await artistsService.createSpecialty(req.body);
    res.status(201).json(result);
  }

  async updateSpecialty(req: Request, res: Response) {
    const id = safeBigInt(req.params.id);
    const result = await artistsService.updateSpecialty(id, req.body);
    res.json(result);
  }

  async deleteSpecialty(req: Request, res: Response) {
    const id = safeBigInt(req.params.id);
    const result = await artistsService.deleteSpecialty(id);
    res.json(result);
  }

  async getArtist(req: Request, res: Response) {
    const result = await artistsService.getArtistBySlug(req.params.slug);

    // Background click tracking
    subService.trackClick(EntityType.ARTIST, result.id, {
      planId: result.planId?.toString(),
      isFeatured: !!result.featuredUntil && result.featuredUntil > new Date(),
    }).catch(err => {});

    res.json(result);
  }

  async createArtist(req: Request, res: Response) {
    const result = await artistsService.createArtist(req.body, req.user!.id);
    res.status(201).json(result);
  }

  async updateArtist(req: Request, res: Response) {
    const id = safeBigInt(req.params.id);
    const adminMode = isAdmin(req.user?.role);
    const result = await artistsService.updateArtist(
      id,
      req.body,
      req.user!.id,
      adminMode
    );
    res.json(result);
  }

  async deleteArtist(req: Request, res: Response) {
    const id = safeBigInt(req.params.id);
    const adminMode = isAdmin(req.user?.role);
    const result = await artistsService.deleteArtist(
      id,
      req.user!.id,
      adminMode
    );
    res.json(result);
  }

  async setAvatar(req: Request, res: Response) {
    const id = safeBigInt(req.params.id);
    const adminMode = isAdmin(req.user?.role);
    const result = await artistsService.attachMedia(
      id,
      { mediaId: req.body.mediaId },
      'AVATAR',
      req.user!.id,
      adminMode
    );
    res.json(result);
  }

  async setCover(req: Request, res: Response) {
    const id = safeBigInt(req.params.id);
    const adminMode = isAdmin(req.user?.role);
    const result = await artistsService.attachMedia(
      id,
      { mediaId: req.body.mediaId },
      'COVER',
      req.user!.id,
      adminMode
    );
    res.json(result);
  }

  async addGallery(req: Request, res: Response) {
    const id = safeBigInt(req.params.id);
    const adminMode = isAdmin(req.user?.role);
    const result = await artistsService.attachMedia(
      id,
      { mediaIds: req.body.mediaIds },
      'GALLERY',
      req.user!.id,
      adminMode
    );
    res.json(result);
  }

  async addCertification(req: Request, res: Response) {
    const id = safeBigInt(req.params.id);
    const adminMode = isAdmin(req.user?.role);
    const result = await artistsService.addCertification(
      id,
      req.body,
      req.user!.id,
      adminMode
    );
    res.status(201).json(result);
  }

  async updateCertification(req: Request, res: Response) {
    const certId = safeBigInt(req.params.certId, 'certId');
    const adminMode = isAdmin(req.user?.role);
    const result = await artistsService.updateCertification(
      certId,
      req.body,
      req.user!.id,
      adminMode
    );
    res.json(result);
  }

  async deleteCertification(req: Request, res: Response) {
    const certId = safeBigInt(req.params.certId, 'certId');
    const adminMode = isAdmin(req.user?.role);
    const result = await artistsService.deleteCertification(
      certId,
      req.user!.id,
      adminMode
    );
    res.json(result);
  }

  async verifyCertification(req: Request, res: Response) {
    const certId = safeBigInt(req.params.certId, 'certId');
    const result = await artistsService.verifyCertification(
      certId,
      req.body.isVerified,
      req.user!.id
    );
    res.json(result);
  }

  async assignSpecialties(req: Request, res: Response) {
    const id = safeBigInt(req.params.id);
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
  }
}
