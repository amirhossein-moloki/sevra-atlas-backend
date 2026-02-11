import { Request, Response } from 'express';
import { SearchService } from './search.service';

const searchService = new SearchService();

export class SearchController {
  async search(req: Request, res: Response) {
    const q = req.query.q as string;
    if (!q) {
      return res.json({ salons: [], artists: [], posts: [] });
    }
    const results = await searchService.globalSearch(q);
    res.json(results);
  }
}
