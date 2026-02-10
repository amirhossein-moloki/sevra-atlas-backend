import { Request, Response } from 'express';
import { AuthService } from './auth.service';

const authService = new AuthService();

export class AuthController {
  async requestOtp(req: Request, res: Response) {
    const { phoneNumber } = req.body;
    const result = await authService.requestOtp(
      phoneNumber,
      req.ip,
      req.headers['user-agent']
    );
    res.json(result);
  }

  async verifyOtp(req: Request, res: Response) {
    const { phoneNumber, code } = req.body;
    const result = await authService.verifyOtp(
      phoneNumber,
      code,
      req.ip,
      req.headers['user-agent']
    );
    res.json(result);
  }
}
