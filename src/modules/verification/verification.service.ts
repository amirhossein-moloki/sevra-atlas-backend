import { prisma } from '../../shared/db/prisma';
import { VerificationStatus, EntityType, MediaKind } from '@prisma/client';
import { ApiError } from '../../shared/errors/ApiError';
import { serialize } from '../../shared/utils/serialize';

export class VerificationService {
  async requestVerification(userId: bigint, data: any) {
    const { targetType, targetId, notes, documents } = data;
    const tId = BigInt(targetId);

    return prisma.$transaction(async (tx) => {
      // 1. Check if target exists and user has permission (is owner)
      if (targetType === 'SALON') {
        const salon = await tx.salon.findUnique({
          where: { id: tId },
          include: { owners: { select: { id: true } } },
        });
        if (!salon) throw new ApiError(404, 'Salon not found');
        const isOwner = salon.owners.some(o => o.id === userId);
        if (!isOwner) throw new ApiError(403, 'Only owners can request verification');
      } else if (targetType === 'ARTIST') {
        const artist = await tx.artist.findUnique({
          where: { id: tId },
          include: { owners: { select: { id: true } } },
        });
        if (!artist) throw new ApiError(404, 'Artist not found');
        const isOwner = artist.owners.some(o => o.id === userId);
        if (!isOwner) throw new ApiError(403, 'Only owners can request verification');
      }

      // 2. Check if a request already exists
      const existing = await tx.verificationRequest.findFirst({
        where: targetType === 'SALON' ? { salonId: tId } : { artistId: tId },
      });
      if (existing) throw new ApiError(400, 'A verification request already exists for this entity');

      const docData = [];
      for (const doc of documents) {
        const media = await tx.media.create({
          data: {
            ...doc.media,
            uploadedBy: userId,
            kind: doc.label === 'Business License' ? MediaKind.LICENSE : MediaKind.CERTIFICATE,
          }
        });
        docData.push({
          mediaId: media.id,
          label: doc.label,
        });
      }

      const request = await tx.verificationRequest.create({
        data: {
          requestedById: userId,
          salonId: targetType === 'SALON' ? tId : null,
          artistId: targetType === 'ARTIST' ? tId : null,
          notes,
          status: VerificationStatus.PENDING,
          documents: {
            create: docData,
          },
        },
      });

      return serialize(request);
    });
  }

  async listRequests(query: any) {
    const { status, page = 1, pageSize = 20 } = query;
    const limit = parseInt(pageSize as string) || 20;
    const skip = (parseInt(page as string || '1') - 1) * limit;

    const where: any = {};
    if (status) where.status = status as VerificationStatus;

    const [data, total] = await Promise.all([
      prisma.verificationRequest.findMany({
        where,
        include: { documents: { include: { media: true } }, requestedBy: true },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.verificationRequest.count({ where }),
    ]);

    return {
      data: serialize(data),
      meta: { page: parseInt(page as string || '1'), pageSize: limit, total, totalPages: Math.ceil(total / limit) },
    };
  }

  async reviewRequest(requestId: bigint, data: any, userId: bigint) {
    const { status, notes } = data;

    return prisma.$transaction(async (tx) => {
      const request = await tx.verificationRequest.findUnique({
        where: { id: requestId },
      });
      if (!request) throw new ApiError(404, 'Verification request not found');

      const updatedRequest = await tx.verificationRequest.update({
        where: { id: requestId },
        data: {
          status: status as VerificationStatus,
          notes: notes || request.notes,
          reviewedById: userId,
        },
      });

      if (status === VerificationStatus.VERIFIED) {
        if (request.salonId) {
          await tx.salon.update({
            where: { id: request.salonId },
            data: { verification: VerificationStatus.VERIFIED },
          });
        } else if (request.artistId) {
          await tx.artist.update({
            where: { id: request.artistId },
            data: { verification: VerificationStatus.VERIFIED },
          });
        }
      }

      return serialize(updatedRequest);
    });
  }
}
