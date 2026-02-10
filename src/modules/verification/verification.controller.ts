import { Response } from 'express';
import { VerificationService } from './verification.service';
import { AuthRequest } from '../../shared/middlewares/auth.middleware';

const verificationService = new VerificationService();

export class VerificationController {
  async requestVerification(req: AuthRequest, res: Response) {
    const result = await verificationService.requestVerification(req.user!.id, req.body);
    res.status(201).json(result);
  }

  async listRequests(req: AuthRequest, res: Response) {
    const result = await verificationService.listRequests(req.query);
    res.json(result);
  }

  async reviewRequest(req: AuthRequest, res: Response) {
    const result = await verificationService.reviewRequest(BigInt(req.params.id), req.body, req.user!.id);
    res.json(result);
  }
}
