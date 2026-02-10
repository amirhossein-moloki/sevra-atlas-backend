import { Request, Response } from 'express';
import { ServicesService } from './services.service';

const servicesService = new ServicesService();

export class ServicesController {
  async listCategories(req: Request, res: Response) {
    const result = await servicesService.listServiceCategories(req.query);
    res.json(result);
  }

  async getService(req: Request, res: Response) {
    const result = await servicesService.getServiceBySlug(req.params.slug);
    res.json(result);
  }

  async createCategory(req: Request, res: Response) {
    const result = await servicesService.createCategory(req.body);
    res.status(201).json(result);
  }

  async createService(req: Request, res: Response) {
    const result = await servicesService.createService(req.body);
    res.status(201).json(result);
  }

  async updateService(req: Request, res: Response) {
    const result = await servicesService.updateService(req.params.id, req.body);
    res.json(result);
  }

  async deleteService(req: Request, res: Response) {
    const result = await servicesService.deleteService(req.params.id);
    res.json(result);
  }
}
