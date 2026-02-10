import { prisma } from '../../shared/db/prisma';
import { VerificationStatus, EntityType } from '@prisma/client';
import { ApiError } from '../../shared/errors/ApiError';

export class VerificationService {
  async requestVerification(userId: bigint, data: any) {
    const { targetType, targetId, notes, documents } = data;

    return prisma.$transaction(async (tx) => {
      const docData = [];
      for (const doc of documents) {
        const media = await tx.media.create({
          data: {
            ...doc.media,
            uploadedBy: userId,
            kind: doc.label === 'Business License' ? 'LICENSE' : 'CERTIFICATE',
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
          salonId: targetType === 'SALON' ? BigInt(targetId) : null,
          artistId: targetType === 'ARTIST' ? BigInt(targetId) : null,
          notes,
          status: VerificationStatus.PENDING,
          documents: {
            create: docData,
          },
        },
      });

      return this.serialize(request);
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
      data: data.map(r => this.serialize(r)),
      meta: { page: parseInt(page as string || '1'), pageSize: limit, total, totalPages: Math.ceil(total / limit) },
    };
  }

  async reviewRequest(requestId: bigint, data: any, userId: bigint) {
    const { status, notes } = data;

    const request = await prisma.verificationRequest.findUnique({
      where: { id: requestId },
    });
    if (!request) throw new ApiError(404, 'Verification request not found');

    const updatedRequest = await prisma.verificationRequest.update({
      where: { id: requestId },
      data: {
        status: status as VerificationStatus,
        notes: notes || request.notes,
        reviewedById: userId,
      },
    });

    if (status === VerificationStatus.VERIFIED) {
      if (request.salonId) {
        await prisma.salon.update({
          where: { id: request.salonId },
          data: { verification: VerificationStatus.VERIFIED },
        });
      } else if (request.artistId) {
        await prisma.artist.update({
          where: { id: request.artistId },
          data: { verification: VerificationStatus.VERIFIED },
        });
      }
    }

    return this.serialize(updatedRequest);
  }

  private serialize(obj: any): any {
    if (!obj) return null;
    if (Array.isArray(obj)) return obj.map(o => this.serialize(o));
    const res = { ...obj };
    for (const key in res) {
      if (typeof res[key] === 'bigint') res[key] = res[key].toString();
      else if (typeof res[key] === 'object' && res[key] !== null && !(res[key] instanceof Date)) res[key] = this.serialize(res[key]);
    }
    return res;
  }
}
