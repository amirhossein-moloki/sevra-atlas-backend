import { Router } from 'express';
import { prisma } from '../../shared/db/prisma';
import { authMiddleware, AuthRequest, requireRole } from '../../shared/middlewares/auth.middleware';
import { UserRole, VerificationStatus } from '@prisma/client';

const router = Router();

router.post('/request', authMiddleware, async (req: AuthRequest, res) => {
  const { targetType, targetId, documents } = req.body;
  const id = BigInt(targetId);
  
  const request = await prisma.verificationRequest.create({
    data: {
      requestedById: req.user!.id,
      ...(targetType === 'SALON' ? { salonId: id } : { artistId: id }),
      status: VerificationStatus.PENDING,
      documents: {
        create: documents.map((docId: string) => ({
          mediaId: BigInt(docId),
        })),
      },
    },
  });
  res.json(request);
});

router.patch('/:id', authMiddleware, requireRole([UserRole.ADMIN, UserRole.MODERATOR]), async (req: AuthRequest, res) => {
  const { status, notes } = req.body;
  const result = await prisma.verificationRequest.update({
    where: { id: BigInt(req.params.id) },
    data: {
      status,
      notes,
      reviewedById: req.user!.id,
    },
  });
  res.json(result);
});

export default router;
