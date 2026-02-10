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

  async getCategory(req: Request, res: Response) {
    const result = await taxonomyService.getCategory(BigInt(req.params.id));
    res.json(result);
  }

  async updateCategory(req: Request, res: Response) {
    const result = await taxonomyService.updateCategory(BigInt(req.params.id), req.body);
    res.json(result);
  }

  async deleteCategory(req: Request, res: Response) {
    const result = await taxonomyService.deleteCategory(BigInt(req.params.id));
    res.json(result);
  }

  async listTags(req: Request, res: Response) {
    const result = await taxonomyService.listTags();
    res.json({ data: result });
  }

  async createTag(req: Request, res: Response) {
    const result = await taxonomyService.createTag(req.body);
    res.status(201).json(result);
  }

  async getTag(req: Request, res: Response) {
    const result = await taxonomyService.getTag(BigInt(req.params.id));
    res.json(result);
  }

  async updateTag(req: Request, res: Response) {
    const result = await taxonomyService.updateTag(BigInt(req.params.id), req.body);
    res.json(result);
  }

  async deleteTag(req: Request, res: Response) {
    const result = await taxonomyService.deleteTag(BigInt(req.params.id));
    res.json(result);
  }

  async listSeries(req: Request, res: Response) {
    const result = await taxonomyService.listSeries();
    res.json({ data: result });
  }

  async createSeries(req: Request, res: Response) {
    const result = await taxonomyService.createSeries(req.body);
    res.status(201).json(result);
  }

  async getSeries(req: Request, res: Response) {
    const result = await taxonomyService.getSeries(BigInt(req.params.id));
    res.json(result);
  }

  async updateSeries(req: Request, res: Response) {
    const result = await taxonomyService.updateSeries(BigInt(req.params.id), req.body);
    res.json(result);
  }

  async deleteSeries(req: Request, res: Response) {
    const result = await taxonomyService.deleteSeries(BigInt(req.params.id));
    res.json(result);
  }
}
