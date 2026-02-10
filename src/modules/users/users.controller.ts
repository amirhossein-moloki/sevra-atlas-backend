import { Request, Response } from 'express';
import { UsersService } from './users.service';

const usersService = new UsersService();

export class UsersController {
  async getMe(req: Request, res: Response) {
    const user = await usersService.getUserById((req as any).user.id.toString());
    res.json(user);
  }

  async updateMe(req: Request, res: Response) {
    const user = await usersService.updateUser((req as any).user.id.toString(), req.body);
    res.json({ ok: true, user });
  }

  async listUsers(req: Request, res: Response) {
    const result = await usersService.listUsers(req.query);
    res.json(result);
  }

  async updateRole(req: Request, res: Response) {
    const result = await usersService.updateUserRole(req.params.id, req.body.role);
    res.json(result);
  }

  async updateStatus(req: Request, res: Response) {
    const result = await usersService.updateUserStatus(req.params.id, req.body.status);
    res.json(result);
  }
}
