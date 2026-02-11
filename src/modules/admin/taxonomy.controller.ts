import { Request, Response } from 'express';
import { BlogTaxonomyService } from '../blog/taxonomy.service';
import { ServicesService } from '../services/services.service';
import { ArtistsService } from '../artists/artists.service';

const blogTaxonomyService = new BlogTaxonomyService();
const servicesService = new ServicesService();
const artistsService = new ArtistsService();

export class AdminTaxonomyController {
  async reorderBlogCategories(req: Request, res: Response) {
    const result = await blogTaxonomyService.reorderCategories(req.body.items);
    res.json({ ok: true });
  }

  async reorderServiceCategories(req: Request, res: Response) {
    const result = await servicesService.reorderCategories(req.body.items);
    res.json({ ok: true });
  }

  async reorderSpecialties(req: Request, res: Response) {
    const result = await artistsService.reorderSpecialties(req.body.items);
    res.json({ ok: true });
  }
}
