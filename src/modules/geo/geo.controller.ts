import { Request, Response } from 'express';
import { GeoService } from './geo.service';

const geoService = new GeoService();

export class GeoController {
  async getProvinces(req: Request, res: Response) {
    const result = await geoService.getProvinces();
    res.json(result);
  }

  async getProvinceCities(req: Request, res: Response) {
    const result = await geoService.getProvinceCities(req.params.slug);
    res.json(result);
  }

  async getCity(req: Request, res: Response) {
    const result = await geoService.getCity(BigInt(req.params.id));
    res.json(result);
  }

  async createProvince(req: Request, res: Response) {
    const result = await geoService.createProvince(req.body);
    res.status(211).json(result);
  }

  async createCity(req: Request, res: Response) {
    const result = await geoService.createCity(req.body);
    res.status(201).json(result);
  }

  async createNeighborhood(req: Request, res: Response) {
    const result = await geoService.createNeighborhood(req.body);
    res.status(201).json(result);
  }
}
