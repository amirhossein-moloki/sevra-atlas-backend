import { Request, Response } from 'express';
import { BlogTaxonomyService } from './taxonomy.service';
import { safeBigInt } from '../../shared/utils/bigint';

const taxonomyService = new BlogTaxonomyService();

export class BlogTaxonomyController {
  async listCategories(req: Request, res: Response) {
    const result = await taxonomyService.listCategories();
    res.json(result);
  }

  async createCategory(req: Request, res: Response) {
    const result = await taxonomyService.createCategory(req.body);
    res.status(201).json(result);
  }

  async getCategory(req: Request, res: Response) {
    const id = safeBigInt(req.params.id);
    const result = await taxonomyService.getCategory(id);
    res.json(result);
  }

  async updateCategory(req: Request, res: Response) {
    const id = safeBigInt(req.params.id);
    const result = await taxonomyService.updateCategory(id, req.body);
    res.json(result);
  }

  async deleteCategory(req: Request, res: Response) {
    const id = safeBigInt(req.params.id);
    const result = await taxonomyService.deleteCategory(id);
    res.json(result);
  }

  async listTags(req: Request, res: Response) {
    const result = await taxonomyService.listTags();
    res.json(result);
  }

  async createTag(req: Request, res: Response) {
    const result = await taxonomyService.createTag(req.body);
    res.status(201).json(result);
  }

  async getTag(req: Request, res: Response) {
    const id = safeBigInt(req.params.id);
    const result = await taxonomyService.getTag(id);
    res.json(result);
  }

  async updateTag(req: Request, res: Response) {
    const id = safeBigInt(req.params.id);
    const result = await taxonomyService.updateTag(id, req.body);
    res.json(result);
  }

  async deleteTag(req: Request, res: Response) {
    const id = safeBigInt(req.params.id);
    const result = await taxonomyService.deleteTag(id);
    res.json(result);
  }

  async listSeries(req: Request, res: Response) {
    const result = await taxonomyService.listSeries();
    res.json(result);
  }

  async createSeries(req: Request, res: Response) {
    const result = await taxonomyService.createSeries(req.body);
    res.status(201).json(result);
  }

  async getSeries(req: Request, res: Response) {
    const id = safeBigInt(req.params.id);
    const result = await taxonomyService.getSeries(id);
    res.json(result);
  }

  async updateSeries(req: Request, res: Response) {
    const id = safeBigInt(req.params.id);
    const result = await taxonomyService.updateSeries(id, req.body);
    res.json(result);
  }

  async deleteSeries(req: Request, res: Response) {
    const id = safeBigInt(req.params.id);
    const result = await taxonomyService.deleteSeries(id);
    res.json(result);
  }
}
