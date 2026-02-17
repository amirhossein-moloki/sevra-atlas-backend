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
    const { phoneNumber, code, referralCode } = req.body;
    const result = await authService.verifyOtp(
      phoneNumber,
      code,
      req.ip,
      req.headers['user-agent'],
      referralCode
    );
    res.json(result);
  }

  async refresh(req: Request, res: Response) {
    const { refreshToken } = req.body;
    const result = await authService.refresh(refreshToken);
    res.json(result);
  }

  async logout(req: Request, res: Response) {
    const { refreshToken } = req.body;
    const userId = req.user?.id;
    if (!userId) {
      return res.fail('UNAUTHORIZED', 'User not found in session', 401);
    }
    const result = await authService.logout(userId.toString(), refreshToken);
    res.json(result);
  }
}
