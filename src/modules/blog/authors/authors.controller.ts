import { Request, Response } from 'express';
import { BlogAuthorsService } from './authors.service';

const authorsService = new BlogAuthorsService();

export class BlogAuthorsController {
  async listAuthors(req: Request, res: Response) {
    const result = await authorsService.listAuthors();
    res.json({ data: result });
  }

  async getAuthor(req: Request, res: Response) {
    const result = await authorsService.getAuthor(BigInt(req.params.id));
    res.json(result);
  }

  async createAuthor(req: Request, res: Response) {
    const result = await authorsService.createAuthor(req.body);
    res.status(201).json(result);
  }

  async updateAuthor(req: Request, res: Response) {
    const result = await authorsService.updateAuthor(BigInt(req.params.id), req.body);
    res.json(result);
  }

  async deleteAuthor(req: Request, res: Response) {
    const result = await authorsService.deleteAuthor(BigInt(req.params.id));
    res.json(result);
  }
}
