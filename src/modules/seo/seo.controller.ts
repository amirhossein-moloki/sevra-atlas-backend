import { Request, Response } from 'express';
import { SeoService } from './seo.service';

const seoService = new SeoService();

export class SeoController {
  async resolveRedirect(req: Request, res: Response) {
    const path = req.query.path as string;
    const result = await seoService.resolveRedirect(path);
    res.json(result);
  }

  async setSeoMeta(req: Request, res: Response) {
    const result = await seoService.setSeoMeta(req.body);
    res.json(result);
  }

  async createRedirect(req: Request, res: Response) {
    const result = await seoService.createRedirect(req.body);
    res.status(201).json(result);
  }

  async rebuildSitemap(req: Request, res: Response) {
    const result = await seoService.rebuildSitemap();
    res.json(result);
  }
}
