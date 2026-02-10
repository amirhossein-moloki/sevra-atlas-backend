import { prisma } from '../../shared/db/prisma';
import { ApiError } from '../../shared/errors/ApiError';
import { handleSlugChange } from '../../shared/utils/seo';
import { EntityType, AccountStatus } from '@prisma/client';
import { serialize } from '../../shared/utils/serialize';

export class ArtistsService {
  async getArtists(filters: any) {
    const { city, neighborhood, specialty, verified, minRating, sort, page = 1, pageSize = 20 } = filters;
    const limit = parseInt(pageSize as string) || 20;
    const skip = (parseInt(page as string || '1') - 1) * limit;

    const where: any = {
      status: AccountStatus.ACTIVE,
    };

    if (city) where.city = { slug: city };
    if (neighborhood) where.neighborhood = { slug: neighborhood };
    if (specialty) where.specialties = { some: { specialty: { slug: specialty } } };
    if (verified === 'true') where.verification = 'VERIFIED';
    if (minRating) where.avgRating = { gte: parseFloat(minRating as string) };

    let orderBy: any = { createdAt: 'desc' };
    if (sort === 'rating') orderBy = { avgRating: 'desc' };
    if (sort === 'popular') orderBy = { reviewCount: 'desc' };
    if (sort === 'new') orderBy = { createdAt: 'desc' };

    const [data, total] = await Promise.all([
      prisma.artist.findMany({
        where,
        orderBy,
        skip,
        take: limit,
        include: { avatar: true, city: true, neighborhood: true },
      }),
      prisma.artist.count({ where }),
    ]);

    return {
      data: serialize(data),
      meta: { page: parseInt(page as string || '1'), pageSize: limit, total, totalPages: Math.ceil(total / limit) },
    };
  }

  async getArtistBySlug(slug: string) {
    const artist = await prisma.artist.findUnique({
      where: { slug },
      include: {
        avatar: true,
        cover: true,
        city: true,
        neighborhood: true,
        specialties: { include: { specialty: true } },
        certifications: { include: { media: true } },
        salonArtists: { include: { salon: true } },
        seoMeta: true,
      },
    });

    if (!artist || artist.status !== AccountStatus.ACTIVE) {
      throw new ApiError(404, 'Artist not found');
    }

    return serialize(artist);
  }

  async createArtist(data: any, userId: bigint) {
    const artist = await prisma.artist.create({
      data: {
        ...data,
        primaryOwnerId: userId,
        owners: { connect: { id: userId } },
        cityId: data.cityId ? BigInt(data.cityId) : undefined,
        neighborhoodId: data.neighborhoodId ? BigInt(data.neighborhoodId) : undefined,
      },
    });
    return serialize(artist);
  }

  async updateArtist(id: bigint, data: any, userId: bigint, isAdmin: boolean) {
    const artist = await prisma.artist.findUnique({
      where: { id },
      include: { owners: { select: { id: true } } },
    });
    if (!artist) throw new ApiError(404, 'Artist not found');

    const isOwner = artist.owners.some(o => o.id === userId);
    if (!isAdmin && !isOwner) {
      throw new ApiError(403, 'Forbidden');
    }

    if (data.slug && data.slug !== artist.slug) {
      await handleSlugChange(EntityType.ARTIST, id, artist.slug, data.slug, '/atlas/artist');
    }

    const updatedArtist = await prisma.artist.update({
      where: { id },
      data: {
        ...data,
        cityId: data.cityId ? BigInt(data.cityId) : undefined,
        neighborhoodId: data.neighborhoodId ? BigInt(data.neighborhoodId) : undefined,
      },
    });
    return serialize(updatedArtist);
  }

  async deleteArtist(id: bigint, userId: bigint, isAdmin: boolean) {
    const artist = await prisma.artist.findUnique({
      where: { id },
      include: { owners: { select: { id: true } } },
    });
    if (!artist) throw new ApiError(404, 'Artist not found');

    const isOwner = artist.owners.some(o => o.id === userId);
    if (!isAdmin && !isOwner) {
      throw new ApiError(403, 'Forbidden');
    }

    await prisma.artist.update({
      where: { id },
      data: { status: AccountStatus.DELETED, deletedAt: new Date() },
    });
    return { ok: true };
  }

  async attachMedia(id: bigint, mediaData: any, kind: 'AVATAR' | 'COVER' | 'GALLERY', userId: bigint) {
    const media = await prisma.media.create({
      data: {
        ...mediaData,
        uploadedBy: userId,
        kind,
        entityType: EntityType.ARTIST,
        entityId: id,
      },
    });

    if (kind === 'AVATAR') {
      await prisma.artist.update({ where: { id }, data: { avatarMediaId: media.id } });
    } else if (kind === 'COVER') {
      await prisma.artist.update({ where: { id }, data: { coverMediaId: media.id } });
    }

    return serialize(media);
  }

  async addCertification(id: bigint, data: any, userId: bigint) {
    let mediaId: bigint | undefined;
    if (data.media) {
      const media = await prisma.media.create({
        data: {
          ...data.media,
          uploadedBy: userId,
          kind: 'CERTIFICATE',
          entityType: EntityType.ARTIST,
          entityId: id,
        },
      });
      mediaId = media.id;
    }

    const cert = await prisma.artistCertification.create({
      data: {
        artistId: id,
        title: data.title,
        issuer: data.issuer,
        issuerSlug: data.issuerSlug,
        category: data.category,
        level: data.level,
        issuedAt: data.issuedAt ? new Date(data.issuedAt) : undefined,
        expiresAt: data.expiresAt ? new Date(data.expiresAt) : undefined,
        credentialId: data.credentialId,
        credentialUrl: data.credentialUrl,
        mediaId,
      },
    });

    return serialize(cert);
  }

  async updateCertification(certId: bigint, data: any) {
    const cert = await prisma.artistCertification.update({
      where: { id: certId },
      data: {
        ...data,
        issuedAt: data.issuedAt ? new Date(data.issuedAt) : undefined,
        expiresAt: data.expiresAt ? new Date(data.expiresAt) : undefined,
      },
    });
    return serialize(cert);
  }

  async deleteCertification(certId: bigint) {
    await prisma.artistCertification.delete({ where: { id: certId } });
    return { ok: true };
  }

  async verifyCertification(certId: bigint, isVerified: boolean, userId: bigint) {
    await prisma.artistCertification.update({
      where: { id: certId },
      data: {
        isVerified,
        verifiedAt: new Date(),
        verifiedById: userId,
      },
    });
    return { ok: true };
  }

  async listSpecialties() {
    return prisma.specialty.findMany({ orderBy: { order: 'asc' } });
  }

  async assignSpecialties(id: bigint, specialtyIds: number[], mode: 'replace' | 'append') {
    return prisma.$transaction(async (tx) => {
      if (mode === 'replace') {
        await tx.artistSpecialty.deleteMany({ where: { artistId: id } });
      }

      for (const sId of specialtyIds) {
        await tx.artistSpecialty.upsert({
          where: {
            artistId_specialtyId: { artistId: id, specialtyId: BigInt(sId) },
          },
          create: {
            artistId: id,
            specialtyId: BigInt(sId),
          },
          update: {},
        });
      }
      return { ok: true };
    });
  }

}
