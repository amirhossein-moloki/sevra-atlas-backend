import { Request, Response } from 'express';
import { AdminService } from './admin.service';
import { JobsService } from './jobs.service';
import { SalonsService } from '../salons/salons.service';
import { ArtistsService } from '../artists/artists.service';
import { AccountStatus } from '@prisma/client';

const adminService = new AdminService();
const jobsService = new JobsService();
const salonsService = new SalonsService();
const artistsService = new ArtistsService();

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

  async updateSalonStatus(req: Request, res: Response) {
    const result = await salonsService.updateSalon(BigInt(req.params.id), { status: req.body.status }, BigInt(0), true);
    res.json(result);
  }

  async updateArtistStatus(req: Request, res: Response) {
    const result = await artistsService.updateArtist(BigInt(req.params.id), { status: req.body.status }, BigInt(0), true);
    res.json(result);
  }

  async getQueuesHealth(req: Request, res: Response) {
    const result = await jobsService.getQueuesHealth();
    res.json(result);
  }

  async getJobStatus(req: Request, res: Response) {
    const { queue, id } = req.params;
    const result = await jobsService.getJobStatus(queue, id);
    res.json(result);
  }
}
