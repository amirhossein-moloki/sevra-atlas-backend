import { Router } from 'express';
import { prisma } from '../../shared/db/prisma';
import { authMiddleware, AuthRequest } from '../../shared/middlewares/auth.middleware';

const router = Router();

router.post('/follow', authMiddleware, async (req: AuthRequest, res) => {
  const { targetType, targetId } = req.body;
  const id = BigInt(targetId);
  const result = await prisma.follow.create({
    data: {
      followerId: req.user!.id,
      targetType,
      ...(targetType === 'SALON' ? { salonId: id } : { artistId: id }),
    },
  });
  res.json(result);
});

router.delete('/follow', authMiddleware, async (req: AuthRequest, res) => {
  const { targetType, targetId } = req.body;
  const id = BigInt(targetId);
  await prisma.follow.deleteMany({
    where: {
      followerId: req.user!.id,
      targetType,
      ...(targetType === 'SALON' ? { salonId: id } : { artistId: id }),
    },
  });
  res.status(204).send();
});

router.post('/save', authMiddleware, async (req: AuthRequest, res) => {
  const { targetType, targetId } = req.body;
  const id = BigInt(targetId);
  const result = await prisma.save.create({
    data: {
      userId: req.user!.id,
      targetType,
      ...(targetType === 'SALON' ? { salonId: id } : 
         targetType === 'ARTIST' ? { artistId: id } : { postId: id }),
    },
  });
  res.json(result);
});

export default router;
