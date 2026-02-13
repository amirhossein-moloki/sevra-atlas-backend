import { VerificationStatus, MediaKind, Prisma } from '@prisma/client';
import { ApiError } from '../../shared/errors/ApiError';
import { verificationRepository, VerificationRepository } from './verification.repository';
import { salonsRepository, SalonsRepository } from '../salons/salons.repository';
import { artistsRepository, ArtistsRepository } from '../artists/artists.repository';
import { mediaRepository, MediaRepository } from '../media/media.repository';
import { withTx } from '../../shared/db/tx';

export class VerificationService {
  constructor(
    private readonly repo: VerificationRepository = verificationRepository,
    private readonly salonsRepo: SalonsRepository = salonsRepository,
    private readonly artistsRepo: ArtistsRepository = artistsRepository,
    private readonly mediaRepo: MediaRepository = mediaRepository
  ) {}

  async requestVerification(userId: bigint, data: any) {
    const { targetType, targetId, notes, documents } = data;
    const tId = BigInt(targetId);

    return withTx(async (tx) => {
      // 1. Check if target exists and user has permission (is owner)
      if (targetType === 'SALON') {
        const salon = await this.salonsRepo.findUnique(tId, { owners: { select: { id: true } } }, tx);
        if (!salon) throw new ApiError(404, 'Salon not found');
        const isOwner = (salon.owners as any[]).some(o => o.id === userId);
        if (!isOwner) throw new ApiError(403, 'Only owners can request verification');
      } else if (targetType === 'ARTIST') {
        const artist = await this.artistsRepo.findUnique(tId, { owners: { select: { id: true } } }, tx);
        if (!artist) throw new ApiError(404, 'Artist not found');
        const isOwner = (artist.owners as any[]).some(o => o.id === userId);
        if (!isOwner) throw new ApiError(403, 'Only owners can request verification');
      }

      // 2. Check if a request already exists
      const existing = await this.repo.findFirst(targetType === 'SALON' ? { salonId: tId } : { artistId: tId }, tx);
      if (existing) throw new ApiError(400, 'A verification request already exists for this entity');

      const docData = [];
      for (const doc of documents) {
        const mediaId = BigInt(doc.mediaId);
        const media = await this.mediaRepo.findUnique(mediaId, tx);
        if (!media) throw new ApiError(404, `Media ${doc.mediaId} not found`);
        if (media.uploadedBy !== userId) throw new ApiError(403, `You do not own media ${doc.mediaId}`);

        await this.mediaRepo.update(mediaId, {
          kind: doc.label === 'Business License' ? MediaKind.LICENSE : MediaKind.CERTIFICATE,
        }, tx);

        docData.push({
          mediaId,
          label: doc.label,
        });
      }

      const request = await this.repo.create({
        requestedById: userId,
        salonId: targetType === 'SALON' ? tId : null,
        artistId: targetType === 'ARTIST' ? tId : null,
        notes,
        status: VerificationStatus.PENDING,
        documents: {
          create: docData,
        },
      }, tx);

      return request;
    });
  }

  async listRequests(query: any) {
    const { status, page = 1, pageSize = 20 } = query;
    const limit = parseInt(pageSize as string) || 20;
    const skip = (parseInt(page as string || '1') - 1) * limit;

    const where: Prisma.VerificationRequestWhereInput = {};
    if (status) where.status = status as VerificationStatus;

    const { data, total } = await this.repo.findMany({
      where,
      include: { documents: { include: { media: true } }, requestedBy: true },
      orderBy: { createdAt: 'desc' },
      skip,
      take: limit,
    });

    return {
      data: data,
      meta: { page: parseInt(page as string || '1'), pageSize: limit, total, totalPages: Math.ceil(total / limit) },
    };
  }

  async reviewRequest(requestId: bigint, data: any, userId: bigint) {
    const { status, notes } = data;

    return withTx(async (tx) => {
      const request = await this.repo.findUnique(requestId, tx);
      if (!request) throw new ApiError(404, 'Verification request not found');

      const updatedRequest = await this.repo.update(requestId, {
        status: status as VerificationStatus,
        notes: notes || request.notes,
        reviewedById: userId,
      }, tx);

      if (status === VerificationStatus.VERIFIED) {
        if (request.salonId) {
          await this.salonsRepo.update(request.salonId, { verification: VerificationStatus.VERIFIED }, tx);
        } else if (request.artistId) {
          await this.artistsRepo.update(request.artistId, { verification: VerificationStatus.VERIFIED }, tx);
        }
      }

      return updatedRequest;
    });
  }
}
