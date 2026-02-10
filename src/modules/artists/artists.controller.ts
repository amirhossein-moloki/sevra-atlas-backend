import { Request, Response } from 'express';
import { ArtistsService } from './artists.service';
import { AuthRequest } from '../../shared/middlewares/auth.middleware';
import { UserRole } from '@prisma/client';

const artistsService = new ArtistsService();

export class ArtistsController {
  async getArtists(req: Request, res: Response) {
    const result = await artistsService.getArtists(req.query);
    res.json(result);
  }

  async listSpecialties(req: Request, res: Response) {
    const result = await artistsService.listSpecialties();
    res.json({ data: result });
  }

  async getArtist(req: Request, res: Response) {
    const result = await artistsService.getArtistBySlug(req.params.slug);
    res.json(result);
  }

  async createArtist(req: AuthRequest, res: Response) {
    const result = await artistsService.createArtist(req.body, req.user!.id);
    res.status(201).json(result);
  }

  async updateArtist(req: AuthRequest, res: Response) {
    const isAdmin = req.user!.role === UserRole.ADMIN;
    const result = await artistsService.updateArtist(
      BigInt(req.params.id),
      req.body,
      req.user!.id,
      isAdmin
    );
    res.json(result);
  }

  async deleteArtist(req: AuthRequest, res: Response) {
    const isAdmin = req.user!.role === UserRole.ADMIN;
    const result = await artistsService.deleteArtist(
      BigInt(req.params.id),
      req.user!.id,
      isAdmin
    );
    res.json(result);
  }

  async setAvatar(req: AuthRequest, res: Response) {
    const result = await artistsService.attachMedia(
      BigInt(req.params.id),
      req.body.media,
      'AVATAR',
      req.user!.id
    );
    res.json(result);
  }

  async setCover(req: AuthRequest, res: Response) {
    const result = await artistsService.attachMedia(
      BigInt(req.params.id),
      req.body.media,
      'COVER',
      req.user!.id
    );
    res.json(result);
  }

  async addGallery(req: AuthRequest, res: Response) {
    const result = await artistsService.attachMedia(
      BigInt(req.params.id),
      req.body.media,
      'GALLERY',
      req.user!.id
    );
    res.json(result);
  }

  async addCertification(req: AuthRequest, res: Response) {
    const result = await artistsService.addCertification(
      BigInt(req.params.id),
      req.body,
      req.user!.id
    );
    res.status(201).json(result);
  }

  async updateCertification(req: AuthRequest, res: Response) {
    const result = await artistsService.updateCertification(
      BigInt(req.params.certId),
      req.body
    );
    res.json(result);
  }

  async deleteCertification(req: AuthRequest, res: Response) {
    const result = await artistsService.deleteCertification(
      BigInt(req.params.certId)
    );
    res.json(result);
  }

  async verifyCertification(req: AuthRequest, res: Response) {
    const result = await artistsService.verifyCertification(
      BigInt(req.params.certId),
      req.body.isVerified,
      req.user!.id
    );
    res.json(result);
  }

  async assignSpecialties(req: AuthRequest, res: Response) {
    const mode = (req.body.mode as 'replace' | 'append') || 'replace';
    const result = await artistsService.assignSpecialties(
      BigInt(req.params.id),
      req.body.specialtyIds,
      mode
    );
    res.json(result);
  }
}
