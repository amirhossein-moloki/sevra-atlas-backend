import { Router } from 'express';
import { UsersController } from './users.controller';
import { FollowsController } from '../follows/follows.controller';
import { SavesController } from '../saves/saves.controller';
import { requireAuth, requireRole } from '../../shared/middlewares/auth.middleware';
import { validate } from '../../shared/middlewares/validate.middleware';
import { updateMeSchema, updateRoleSchema, updateStatusSchema } from './users.validators';
import { UserRole } from '@prisma/client';

const router = Router();
const controller = new UsersController();
const followsController = new FollowsController();
const savesController = new SavesController();

// Me endpoints
router.get('/me', requireAuth(), controller.getMe);
router.get('/me/follows', requireAuth(), followsController.getMyFollows);
router.get('/me/saves', requireAuth(), savesController.getMySaves);
router.patch('/me', requireAuth(), validate(updateMeSchema), controller.updateMe);

// Admin endpoints
router.get('/admin/users', requireAuth(), requireRole([UserRole.ADMIN]), controller.listUsers);
router.patch('/admin/users/:id/role', requireAuth(), requireRole([UserRole.ADMIN]), validate(updateRoleSchema), controller.updateRole);
router.patch('/admin/users/:id/status', requireAuth(), requireRole([UserRole.ADMIN]), validate(updateStatusSchema), controller.updateStatus);

export default router;
