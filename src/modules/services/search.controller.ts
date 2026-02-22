import { Request, Response } from 'express';
import { SearchService } from './search.service';

const searchService = new SearchService();

export class SearchController {
  async search(req: Request, res: Response) {
    const q = req.query.q as string;
    const context = req.query.context as string;
    if (!q) {
      return res.json({ salons: [], artists: [], posts: [] });
    }
    const results = await searchService.globalSearch(q, context);
    res.json(results);
  }
}
