import { Prisma } from '@prisma/client';

export const SalonQueryFragments = {
  LIST_INCLUDE: {
    avatar: true,
    city: true,
    neighborhood: true,
  } satisfies Prisma.SalonInclude,

  DETAIL_INCLUDE: {
    avatar: true,
    cover: true,
    city: true,
    neighborhood: true,
    services: { include: { service: true } },
    salonArtists: { include: { artist: true } },
    seoMeta: true,
  } satisfies Prisma.SalonInclude,
};

export const ArtistQueryFragments = {
  LIST_INCLUDE: {
    avatar: true,
    city: true,
    neighborhood: true,
  } satisfies Prisma.ArtistInclude,

  DETAIL_INCLUDE: {
    avatar: true,
    cover: true,
    city: true,
    neighborhood: true,
    specialties: { include: { specialty: true } },
    certifications: { include: { media: true } },
    salonArtists: { include: { salon: true } },
    seoMeta: true,
  } satisfies Prisma.ArtistInclude,
};

export const PostQueryFragments = {
  LIST_INCLUDE: {
    author: { include: { user: { select: { id: true, username: true, firstName: true, lastName: true, profilePicture: true } } } },
    category: true,
    coverMedia: true,
    tags: { include: { tag: true } },
    _count: { select: { comments: { where: { status: 'approved' } } } }
  } satisfies Prisma.PostInclude,

  DETAIL_INCLUDE: {
    author: { include: { user: { select: { id: true, username: true, firstName: true, lastName: true, profilePicture: true } } } },
    category: true,
    coverMedia: true,
    ogImage: true,
    tags: { include: { tag: true } },
    series: true,
    mediaAttachments: { include: { media: true } }
  } satisfies Prisma.PostInclude,
};

export const UserQueryFragments = {
  PUBLIC_SELECT: {
    id: true,
    username: true,
    firstName: true,
    lastName: true,
    profilePicture: true,
  } satisfies Prisma.UserSelect,
};
