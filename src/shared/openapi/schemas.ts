import { z } from './registry';

export const MediaSchema = z.object({
  id: z.string(),
  storageKey: z.string(),
  url: z.string(),
  type: z.string(),
  mime: z.string(),
  width: z.number().nullable(),
  height: z.number().nullable(),
  sizeBytes: z.number(),
  altText: z.string(),
  title: z.string(),
  createdAt: z.string(),
}).openapi('Media');

export const SeoMetaSchema = z.object({
  id: z.string(),
  title: z.string().nullable(),
  description: z.string().nullable(),
  canonicalUrl: z.string().nullable(),
  ogTitle: z.string().nullable(),
  ogDescription: z.string().nullable(),
  twitterTitle: z.string().nullable(),
  twitterDesc: z.string().nullable(),
  h1: z.string().nullable(),
  breadcrumbLabel: z.string().nullable(),
}).openapi('SeoMeta');

export const CitySchema = z.object({
  id: z.string(),
  nameFa: z.string(),
  nameEn: z.string().nullable(),
  slug: z.string(),
}).openapi('City');

export const NeighborhoodSchema = z.object({
  id: z.string(),
  nameFa: z.string(),
  slug: z.string(),
}).openapi('Neighborhood');

export const SpecialtySchema = z.object({
  id: z.string(),
  nameFa: z.string(),
  slug: z.string(),
  order: z.number(),
}).openapi('Specialty');

export const SalonSchema = z.object({
  id: z.string(),
  name: z.string(),
  slug: z.string(),
  summary: z.string().nullable(),
  description: z.string().nullable(),
  phone: z.string().nullable(),
  instagram: z.string().nullable(),
  website: z.string().nullable(),
  addressLine: z.string().nullable(),
  avgRating: z.number(),
  reviewCount: z.number(),
  verification: z.string(),
  status: z.string(),
  avatar: MediaSchema.optional().nullable(),
  city: CitySchema.optional().nullable(),
  neighborhood: NeighborhoodSchema.optional().nullable(),
}).openapi('Salon');

export const ArtistSchema = z.object({
  id: z.string(),
  fullName: z.string(),
  slug: z.string(),
  summary: z.string().nullable(),
  bio: z.string().nullable(),
  avgRating: z.number(),
  reviewCount: z.number(),
  verification: z.string(),
  status: z.string(),
  avatar: MediaSchema.optional().nullable(),
  city: CitySchema.optional().nullable(),
}).openapi('Artist');

export const BlogPostSchema = z.object({
  id: z.string(),
  slug: z.string(),
  title: z.string(),
  excerpt: z.string(),
  content: z.string(),
  publishedAt: z.string().nullable(),
  status: z.string(),
  author: z.object({
    displayName: z.string(),
    avatar: MediaSchema.optional().nullable(),
  }).optional(),
  category: z.object({
    id: z.string(),
    name: z.string(),
    slug: z.string(),
  }).optional().nullable(),
  coverMedia: MediaSchema.optional().nullable(),
}).openapi('BlogPost');

export const CategorySchema = z.object({
  id: z.string(),
  name: z.string(),
  slug: z.string(),
  description: z.string().nullable(),
  order: z.number(),
}).openapi('Category');

export const TagSchema = z.object({
  id: z.string(),
  name: z.string(),
  slug: z.string(),
  description: z.string().nullable(),
}).openapi('Tag');

export const CommentSchema = z.object({
  id: z.string(),
  content: z.string(),
  createdAt: z.string(),
  status: z.string(),
  user: z.object({
    username: z.string(),
    firstName: z.string(),
    lastName: z.string(),
  }),
}).openapi('Comment');

export const ReviewSchema = z.object({
  id: z.string(),
  rating: z.number(),
  title: z.string().nullable(),
  body: z.string().nullable(),
  status: z.string(),
  createdAt: z.string(),
  author: z.object({
    firstName: z.string(),
    lastName: z.string(),
    avatar: z.string().optional().nullable(),
  }).optional(),
}).openapi('Review');

export const ArtistCertificationSchema = z.object({
  id: z.string(),
  title: z.string(),
  issuer: z.string(),
  issuedAt: z.string().nullable(),
  isVerified: z.boolean(),
  media: MediaSchema.optional().nullable(),
}).openapi('ArtistCertification');

export const SeriesSchema = z.object({
  id: z.string(),
  title: z.string(),
  slug: z.string(),
  description: z.string().nullable(),
  orderStrategy: z.string(),
}).openapi('Series');

export const AuthorSchema = z.object({
  userId: z.string(),
  displayName: z.string(),
  bio: z.string(),
  avatar: MediaSchema.optional().nullable(),
}).openapi('Author');

export const RevisionSchema = z.object({
  id: z.string(),
  postId: z.string(),
  title: z.string(),
  content: z.string(),
  changeNote: z.string().nullable(),
  createdAt: z.string(),
}).openapi('Revision');

export const ReactionSchema = z.object({
  id: z.string(),
  reaction: z.string(),
  userId: z.string(),
  createdAt: z.string(),
}).openapi('Reaction');

export const PageSchema = z.object({
  id: z.string(),
  slug: z.string(),
  title: z.string(),
  content: z.string(),
  status: z.string(),
  publishedAt: z.string().nullable(),
}).openapi('Page');

export const MenuItemSchema = z.object({
  id: z.string(),
  label: z.string(),
  url: z.string(),
  order: z.number(),
  targetBlank: z.boolean(),
  parentId: z.string().nullable(),
}).openapi('MenuItem');

export const MenuSchema = z.object({
  id: z.string(),
  name: z.string(),
  location: z.string(),
  items: z.array(MenuItemSchema).optional(),
}).openapi('Menu');

export const FollowSchema = z.object({
  id: z.string(),
  followerId: z.string(),
  targetType: z.string(),
  salonId: z.string().optional().nullable(),
  artistId: z.string().optional().nullable(),
}).openapi('Follow');

export const SaveSchema = z.object({
  id: z.string(),
  userId: z.string(),
  targetType: z.string(),
  salonId: z.string().optional().nullable(),
  artistId: z.string().optional().nullable(),
  postId: z.string().optional().nullable(),
}).openapi('Save');

export const VerificationRequestSchema = z.object({
  id: z.string(),
  status: z.string(),
  notes: z.string().nullable(),
  createdAt: z.string(),
}).openapi('VerificationRequest');

export const ReportSchema = z.object({
  id: z.string(),
  reason: z.string(),
  details: z.string().nullable(),
  status: z.string(),
}).openapi('Report');
