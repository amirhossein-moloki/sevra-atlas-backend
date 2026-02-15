import { Request, Response } from 'express';
import { BlogAuthorsService } from './authors.service';
import { safeBigInt } from '../../../shared/utils/bigint';

const authorsService = new BlogAuthorsService();

export class BlogAuthorsController {
  async listAuthors(req: Request, res: Response) {
    const result = await authorsService.listAuthors();
    res.json(result);
  }

  async getAuthor(req: Request, res: Response) {
    const id = safeBigInt(req.params.id);
    const result = await authorsService.getAuthor(id);
    res.json(result);
  }

  async createAuthor(req: Request, res: Response) {
    const result = await authorsService.createAuthor(req.body);
    res.status(201).json(result);
  }

  async updateAuthor(req: Request, res: Response) {
    const id = safeBigInt(req.params.id);
    const result = await authorsService.updateAuthor(id, req.body);
    res.json(result);
  }

  async deleteAuthor(req: Request, res: Response) {
    const id = safeBigInt(req.params.id);
    const result = await authorsService.deleteAuthor(id);
    res.json(result);
  }
}
