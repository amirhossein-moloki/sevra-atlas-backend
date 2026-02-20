import { Request, Response } from 'express';
import { AdminAuthService } from './admin.auth.service';
import { AdminLoginInput } from './admin.auth.validators';

const authService = new AdminAuthService();

export class AdminAuthController {
  async login(req: Request<{}, {}, AdminLoginInput>, res: Response) {
    const { identifier, password } = req.body;
    const result = await authService.login(identifier, password);
    res.status(200).json({
      success: true,
      data: result,
    });
  }
}
