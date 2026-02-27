import { z, registry } from './registry';

export const MediaSchema = registry.register('Media', z.object({
  id: z.string(),
  url: z.string(),
  storageKey: z.string(),
  type: z.string(),
  mime: z.string(),
  sizeBytes: z.number(),
  width: z.number().nullable(),
  height: z.number().nullable(),
  duration: z.number().nullable(),
  altText: z.string().nullable(),
  title: z.string().nullable(),
  kind: z.string().nullable(),
  variants: z.record(z.object({
    url: z.string(),
    mime: z.string(),
    width: z.number(),
    height: z.number(),
    sizeBytes: z.number(),
  })).nullable(),
  createdAt: z.string(),
}));

export const SeoMetaSchema = registry.register('SeoMeta', z.object({
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
}));

export const ProvinceSchema = registry.register('Province', z.object({
  id: z.string(),
  nameFa: z.string(),
  nameEn: z.string().nullable(),
  slug: z.string(),
}));

export const CitySchema = registry.register('City', z.object({
  id: z.string(),
  nameFa: z.string(),
  nameEn: z.string().nullable(),
  slug: z.string(),
  province: ProvinceSchema.optional().nullable(),
}));

export const NeighborhoodSchema = registry.register('Neighborhood', z.object({
  id: z.string(),
  nameFa: z.string(),
  slug: z.string(),
}));

export const SpecialtySchema = registry.register('Specialty', z.object({
  id: z.string(),
  nameFa: z.string(),
  slug: z.string(),
  order: z.number(),
}));

export const ArtistSchema = registry.register('Artist', z.object({
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
}));

export const SalonArtistResponseSchema = registry.register('SalonArtistResponse', z.object({
  artist: ArtistSchema,
  roleTitle: z.string().nullable(),
  isActive: z.boolean(),
}));

export const SalonSchema = registry.register('Salon', z.object({
  id: z.string(),
  name: z.string(),
  slug: z.string(),
  summary: z.string().nullable(),
  description: z.string().nullable(),
  phone: z.string().nullable(),
  instagram: z.string().nullable(),
  website: z.string().nullable(),
  addressLine: z.string().nullable(),
  fullAddress: z.string().optional().nullable(),
  avgRating: z.number(),
  reviewCount: z.number(),
  verification: z.string(),
  status: z.string(),
  avatar: MediaSchema.optional().nullable(),
  city: CitySchema.optional().nullable(),
  neighborhood: NeighborhoodSchema.optional().nullable(),
  salonArtists: z.array(SalonArtistResponseSchema).optional(),
}));

export const BlogPostSchema = registry.register('BlogPost', z.object({
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
}));

export const CategorySchema = registry.register('Category', z.object({
  id: z.string(),
  name: z.string(),
  slug: z.string(),
  description: z.string().nullable(),
  order: z.number(),
}));

export const TagSchema = registry.register('Tag', z.object({
  id: z.string(),
  name: z.string(),
  slug: z.string(),
  description: z.string().nullable(),
}));

export const CommentSchema = registry.register('Comment', z.object({
  id: z.string(),
  content: z.string(),
  createdAt: z.string(),
  status: z.string(),
  user: z.object({
    username: z.string(),
    firstName: z.string(),
    lastName: z.string(),
  }),
}));

export const ReviewSchema = registry.register('Review', z.object({
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
}));

export const ArtistCertificationSchema = registry.register('ArtistCertification', z.object({
  id: z.string(),
  title: z.string(),
  issuer: z.string(),
  issuedAt: z.string().nullable(),
  isVerified: z.boolean(),
  media: MediaSchema.optional().nullable(),
}));

export const ArtistSpecialtyResponseSchema = registry.register('ArtistSpecialtyResponse', z.object({
  specialtyId: z.string(),
  nameFa: z.string(),
  slug: z.string(),
  priceToman: z.string().nullable(),
  durationMin: z.number().nullable(),
  isActive: z.boolean(),
  note: z.string().nullable(),
  order: z.number(),
}));

export const SalonServiceResponseSchema = registry.register('SalonServiceResponse', z.object({
  serviceId: z.string(),
  nameFa: z.string(),
  slug: z.string(),
  priceToman: z.string().nullable(), // deprecated
  minPriceToman: z.string(),
  maxPriceToman: z.string(),
  durationMin: z.number().nullable(), // deprecated
  minDurationMin: z.number().nullable(),
  maxDurationMin: z.number().nullable(),
  isActive: z.boolean(),
  notes: z.string().nullable(),
}));

export const GroupedSalonServiceResponseSchema = registry.register('GroupedSalonServiceResponse', z.object({
  category: z.object({
    id: z.string(),
    nameFa: z.string(),
    slug: z.string(),
  }),
  services: z.array(SalonServiceResponseSchema),
}));

export const SeriesSchema = registry.register('Series', z.object({
  id: z.string(),
  title: z.string(),
  slug: z.string(),
  description: z.string().nullable(),
  orderStrategy: z.string(),
}));

export const AuthorSchema = registry.register('Author', z.object({
  userId: z.string(),
  displayName: z.string(),
  bio: z.string(),
  avatar: MediaSchema.optional().nullable(),
}));

export const RevisionSchema = registry.register('Revision', z.object({
  id: z.string(),
  postId: z.string(),
  title: z.string(),
  content: z.string(),
  changeNote: z.string().nullable(),
  createdAt: z.string(),
}));

export const ReactionSchema = registry.register('Reaction', z.object({
  id: z.string(),
  reaction: z.string(),
  userId: z.string(),
  createdAt: z.string(),
}));

export const PageSchema = registry.register('Page', z.object({
  id: z.string(),
  slug: z.string(),
  title: z.string(),
  content: z.string(),
  status: z.string(),
  publishedAt: z.string().nullable(),
}));

export const MenuItemSchema = registry.register('MenuItem', z.object({
  id: z.string(),
  label: z.string(),
  url: z.string(),
  order: z.number(),
  targetBlank: z.boolean(),
  parentId: z.string().nullable(),
}));

export const MenuSchema = registry.register('Menu', z.object({
  id: z.string(),
  name: z.string(),
  location: z.string(),
  items: z.array(MenuItemSchema).optional(),
}));

export const FollowSchema = registry.register('Follow', z.object({
  id: z.string(),
  followerId: z.string(),
  targetType: z.string(),
  salonId: z.string().optional().nullable(),
  artistId: z.string().optional().nullable(),
}));

export const SaveSchema = registry.register('Save', z.object({
  id: z.string(),
  userId: z.string(),
  targetType: z.string(),
  salonId: z.string().optional().nullable(),
  artistId: z.string().optional().nullable(),
  postId: z.string().optional().nullable(),
}));

export const VerificationRequestSchema = registry.register('VerificationRequest', z.object({
  id: z.string(),
  status: z.string(),
  notes: z.string().nullable(),
  createdAt: z.string(),
}));

export const ReportSchema = registry.register('Report', z.object({
  id: z.string(),
  reason: z.string(),
  details: z.string().nullable(),
  status: z.string(),
}));

export const PlanSchema = registry.register('Plan', z.object({
  id: z.string(),
  name: z.string(),
  entityType: z.string(),
  tier: z.string(),
  price: z.string(),
  durationDays: z.number(),
  features: z.array(z.string()),
}));

export const SubscriptionSchema = registry.register('Subscription', z.object({
  id: z.string(),
  planId: z.string(),
  status: z.string(),
  startDate: z.string(),
  endDate: z.string().nullable(),
  nextBillingDate: z.string().nullable(),
}));

export const PaymentSchema = registry.register('Payment', z.object({
  id: z.string(),
  amount: z.string(),
  status: z.string(),
  trackId: z.string().nullable(),
  paymentUrl: z.string().nullable(),
  createdAt: z.string(),
}));
