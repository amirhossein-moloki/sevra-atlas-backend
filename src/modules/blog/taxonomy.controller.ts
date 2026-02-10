import { Request, Response } from 'express';
import { BlogTaxonomyService } from './taxonomy.service';

const taxonomyService = new BlogTaxonomyService();

export class BlogTaxonomyController {
  async listCategories(req: Request, res: Response) {
    const result = await taxonomyService.listCategories();
    res.json({ data: result });
  }

  async createCategory(req: Request, res: Response) {
    const result = await taxonomyService.createCategory(req.body);
    res.status(201).json(result);
  }

  async listTags(req: Request, res: Response) {
    const result = await taxonomyService.listTags();
    res.json({ data: result });
  }

  async createTag(req: Request, res: Response) {
    const result = await taxonomyService.createTag(req.body);
    res.status(201).json(result);
  }
}
