-- CreateEnum
CREATE TYPE "PostStatus" AS ENUM ('draft', 'review', 'scheduled', 'published', 'archived');

-- CreateEnum
CREATE TYPE "PostVisibility" AS ENUM ('public', 'private', 'unlisted');

-- CreateEnum
CREATE TYPE "CommentStatus" AS ENUM ('pending', 'approved', 'spam', 'removed');

-- CreateEnum
CREATE TYPE "OrderStrategy" AS ENUM ('manual', 'by_date');

-- CreateEnum
CREATE TYPE "MenuLocation" AS ENUM ('header', 'footer', 'sidebar');

-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('USER', 'SALON', 'ARTIST', 'AUTHOR', 'MODERATOR', 'ADMIN');

-- CreateEnum
CREATE TYPE "AccountStatus" AS ENUM ('ACTIVE', 'SUSPENDED', 'DELETED');

-- CreateEnum
CREATE TYPE "VerificationStatus" AS ENUM ('NONE', 'PENDING', 'VERIFIED', 'REJECTED');

-- CreateEnum
CREATE TYPE "ReviewStatus" AS ENUM ('PUBLISHED', 'HIDDEN', 'REMOVED');

-- CreateEnum
CREATE TYPE "ReportStatus" AS ENUM ('OPEN', 'UNDER_REVIEW', 'RESOLVED', 'REJECTED');

-- CreateEnum
CREATE TYPE "Gender" AS ENUM ('FEMALE', 'MALE', 'OTHER', 'UNSPECIFIED');

-- CreateEnum
CREATE TYPE "MediaKind" AS ENUM ('AVATAR', 'COVER', 'GALLERY', 'LICENSE', 'CERTIFICATE', 'OG_IMAGE');

-- CreateEnum
CREATE TYPE "EntityType" AS ENUM ('SALON', 'ARTIST', 'REVIEW', 'BLOG_POST', 'BLOG_PAGE', 'CITY', 'PROVINCE', 'CATEGORY');

-- CreateEnum
CREATE TYPE "RobotsIndex" AS ENUM ('INDEX_FOLLOW', 'NOINDEX_FOLLOW', 'NOINDEX_NOFOLLOW');

-- CreateEnum
CREATE TYPE "CanonicalMode" AS ENUM ('SELF', 'CUSTOM');

-- CreateEnum
CREATE TYPE "RedirectType" AS ENUM ('PERMANENT_301', 'TEMPORARY_302');

-- CreateEnum
CREATE TYPE "SitemapChangeFreq" AS ENUM ('ALWAYS', 'HOURLY', 'DAILY', 'WEEKLY', 'MONTHLY', 'YEARLY', 'NEVER');

-- CreateEnum
CREATE TYPE "FollowTargetType" AS ENUM ('SALON', 'ARTIST');

-- CreateEnum
CREATE TYPE "SaveTargetType" AS ENUM ('SALON', 'ARTIST', 'BLOG_POST');

-- CreateTable
CREATE TABLE "users_user" (
    "id" BIGSERIAL NOT NULL,
    "username" VARCHAR(150) NOT NULL,
    "first_name" VARCHAR(150) NOT NULL,
    "last_name" VARCHAR(150) NOT NULL,
    "email" VARCHAR(254) NOT NULL,
    "is_staff" BOOLEAN NOT NULL,
    "is_active" BOOLEAN NOT NULL,
    "date_joined" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "phone_number" VARCHAR(128) NOT NULL,
    "is_phone_verified" BOOLEAN NOT NULL DEFAULT false,
    "profile_picture" VARCHAR(100),
    "score" INTEGER NOT NULL DEFAULT 0,
    "referral_code" VARCHAR(22) NOT NULL,
    "role" "UserRole" NOT NULL DEFAULT 'USER',
    "status" "AccountStatus" NOT NULL DEFAULT 'ACTIVE',
    "verification" "VerificationStatus" NOT NULL DEFAULT 'NONE',
    "gender" "Gender" NOT NULL DEFAULT 'UNSPECIFIED',
    "bio" TEXT,
    "cityId" BIGINT,
    "lastLoginAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "users_user_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OtpAttempt" (
    "id" BIGSERIAL NOT NULL,
    "phoneE164" VARCHAR(32) NOT NULL,
    "ip" VARCHAR(45),
    "userAgent" VARCHAR(255),
    "purpose" VARCHAR(50) NOT NULL,
    "success" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "userId" BIGINT,

    CONSTRAINT "OtpAttempt_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "blog_media" (
    "id" BIGSERIAL NOT NULL,
    "storage_key" VARCHAR(255) NOT NULL,
    "url" TEXT NOT NULL,
    "type" VARCHAR(50) NOT NULL,
    "mime" VARCHAR(100) NOT NULL,
    "width" INTEGER,
    "height" INTEGER,
    "duration" INTEGER,
    "size_bytes" INTEGER NOT NULL DEFAULT 0,
    "alt_text" VARCHAR(255) NOT NULL DEFAULT '',
    "title" VARCHAR(255) NOT NULL DEFAULT '',
    "uploaded_by_id" BIGINT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "kind" "MediaKind",
    "entityType" "EntityType",
    "entityId" BIGINT,

    CONSTRAINT "blog_media_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "blog_authorprofile" (
    "user_id" BIGINT NOT NULL,
    "display_name" VARCHAR(255) NOT NULL,
    "bio" TEXT NOT NULL,
    "avatar_id" BIGINT,

    CONSTRAINT "blog_authorprofile_pkey" PRIMARY KEY ("user_id")
);

-- CreateTable
CREATE TABLE "blog_category" (
    "id" BIGSERIAL NOT NULL,
    "slug" VARCHAR(50) NOT NULL,
    "name" VARCHAR(255) NOT NULL,
    "parent_id" BIGINT,
    "description" TEXT NOT NULL,
    "order" INTEGER NOT NULL DEFAULT 0,
    "seoMetaId" BIGINT,

    CONSTRAINT "blog_category_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "blog_tag" (
    "id" BIGSERIAL NOT NULL,
    "slug" VARCHAR(50) NOT NULL,
    "name" VARCHAR(255) NOT NULL,
    "description" TEXT NOT NULL,

    CONSTRAINT "blog_tag_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "blog_series" (
    "id" BIGSERIAL NOT NULL,
    "slug" VARCHAR(50) NOT NULL,
    "title" VARCHAR(255) NOT NULL,
    "description" TEXT NOT NULL,
    "order_strategy" "OrderStrategy" NOT NULL DEFAULT 'manual',

    CONSTRAINT "blog_series_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "blog_post" (
    "id" BIGSERIAL NOT NULL,
    "slug" VARCHAR(50) NOT NULL,
    "canonical_url" TEXT,
    "title" VARCHAR(255) NOT NULL,
    "excerpt" TEXT NOT NULL,
    "is_hot" BOOLEAN NOT NULL DEFAULT false,
    "content" TEXT NOT NULL,
    "reading_time_sec" INTEGER NOT NULL DEFAULT 0,
    "status" "PostStatus" NOT NULL DEFAULT 'draft',
    "visibility" "PostVisibility" NOT NULL DEFAULT 'public',
    "published_at" TIMESTAMP(3),
    "scheduled_at" TIMESTAMP(3),
    "author_id" BIGINT NOT NULL,
    "category_id" BIGINT,
    "series_id" BIGINT,
    "cover_media_id" BIGINT,
    "og_image_id" BIGINT,
    "seo_title" VARCHAR(255) NOT NULL DEFAULT '',
    "seo_description" TEXT NOT NULL DEFAULT '',
    "views_count" INTEGER NOT NULL DEFAULT 0,
    "seoMetaId" BIGINT,

    CONSTRAINT "blog_post_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "blog_posttag" (
    "id" BIGSERIAL NOT NULL,
    "post_id" BIGINT NOT NULL,
    "tag_id" BIGINT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "blog_posttag_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "blog_revision" (
    "id" BIGSERIAL NOT NULL,
    "post_id" BIGINT NOT NULL,
    "editor_id" BIGINT,
    "content" TEXT NOT NULL,
    "title" VARCHAR(255) NOT NULL,
    "excerpt" TEXT NOT NULL,
    "change_note" VARCHAR(255) NOT NULL DEFAULT '',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "blog_revision_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "blog_comment" (
    "id" BIGSERIAL NOT NULL,
    "post_id" BIGINT NOT NULL,
    "user_id" BIGINT NOT NULL,
    "parent_id" BIGINT,
    "content" TEXT NOT NULL,
    "status" "CommentStatus" NOT NULL DEFAULT 'pending',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "ip" VARCHAR(45),
    "user_agent" VARCHAR(255) NOT NULL DEFAULT '',

    CONSTRAINT "blog_comment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "blog_reaction" (
    "id" BIGSERIAL NOT NULL,
    "user_id" BIGINT NOT NULL,
    "reaction" VARCHAR(50) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "content_type_id" INTEGER NOT NULL,
    "object_id" BIGINT NOT NULL,

    CONSTRAINT "blog_reaction_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "blog_page" (
    "id" BIGSERIAL NOT NULL,
    "slug" VARCHAR(50) NOT NULL,
    "title" VARCHAR(255) NOT NULL,
    "content" TEXT NOT NULL,
    "status" "PostStatus" NOT NULL DEFAULT 'draft',
    "published_at" TIMESTAMP(3),
    "seo_title" VARCHAR(255) NOT NULL DEFAULT '',
    "seo_description" TEXT NOT NULL DEFAULT '',
    "seoMetaId" BIGINT,

    CONSTRAINT "blog_page_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "blog_menu" (
    "id" BIGSERIAL NOT NULL,
    "name" VARCHAR(255) NOT NULL,
    "location" "MenuLocation" NOT NULL,

    CONSTRAINT "blog_menu_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "blog_menuitem" (
    "id" BIGSERIAL NOT NULL,
    "menu_id" BIGINT NOT NULL,
    "parent_id" BIGINT,
    "label" VARCHAR(255) NOT NULL,
    "url" VARCHAR(255) NOT NULL,
    "order" INTEGER NOT NULL DEFAULT 0,
    "target_blank" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "blog_menuitem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "blog_postmedia" (
    "id" BIGSERIAL NOT NULL,
    "post_id" BIGINT NOT NULL,
    "media_id" BIGINT NOT NULL,
    "attachment_type" VARCHAR(50) NOT NULL DEFAULT 'in-content',

    CONSTRAINT "blog_postmedia_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SeoMeta" (
    "id" BIGSERIAL NOT NULL,
    "entityType" "EntityType" NOT NULL,
    "entityId" BIGINT NOT NULL,
    "title" VARCHAR(255),
    "description" TEXT,
    "canonicalMode" "CanonicalMode" NOT NULL DEFAULT 'SELF',
    "canonicalUrl" TEXT,
    "robots" "RobotsIndex" NOT NULL DEFAULT 'INDEX_FOLLOW',
    "ogTitle" VARCHAR(255),
    "ogDescription" TEXT,
    "ogImageMediaId" BIGINT,
    "twitterTitle" VARCHAR(255),
    "twitterDesc" TEXT,
    "twitterImageMediaId" BIGINT,
    "h1" VARCHAR(255),
    "breadcrumbLabel" VARCHAR(255),
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SeoMeta_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SlugHistory" (
    "id" BIGSERIAL NOT NULL,
    "entityType" "EntityType" NOT NULL,
    "entityId" BIGINT NOT NULL,
    "oldSlug" VARCHAR(255) NOT NULL,
    "newSlug" VARCHAR(255) NOT NULL,
    "changedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SlugHistory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RedirectRule" (
    "id" BIGSERIAL NOT NULL,
    "fromPath" VARCHAR(512) NOT NULL,
    "toPath" VARCHAR(512) NOT NULL,
    "type" "RedirectType" NOT NULL DEFAULT 'PERMANENT_301',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RedirectRule_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SitemapUrl" (
    "id" BIGSERIAL NOT NULL,
    "path" VARCHAR(512) NOT NULL,
    "entityType" "EntityType",
    "entityId" BIGINT,
    "lastmod" TIMESTAMP(3),
    "changefreq" "SitemapChangeFreq" DEFAULT 'WEEKLY',
    "priority" DOUBLE PRECISION,
    "isEnabled" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SitemapUrl_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Province" (
    "id" BIGSERIAL NOT NULL,
    "nameFa" VARCHAR(255) NOT NULL,
    "nameEn" VARCHAR(255),
    "slug" VARCHAR(128) NOT NULL,
    "seoMetaId" BIGINT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Province_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "City" (
    "id" BIGSERIAL NOT NULL,
    "provinceId" BIGINT NOT NULL,
    "nameFa" VARCHAR(255) NOT NULL,
    "nameEn" VARCHAR(255),
    "slug" VARCHAR(128) NOT NULL,
    "lat" DOUBLE PRECISION,
    "lng" DOUBLE PRECISION,
    "isLandingEnabled" BOOLEAN NOT NULL DEFAULT true,
    "landingIntro" TEXT,
    "seoMetaId" BIGINT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "City_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Neighborhood" (
    "id" BIGSERIAL NOT NULL,
    "cityId" BIGINT NOT NULL,
    "nameFa" VARCHAR(255) NOT NULL,
    "slug" VARCHAR(128) NOT NULL,

    CONSTRAINT "Neighborhood_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Salon" (
    "id" BIGSERIAL NOT NULL,
    "name" VARCHAR(255) NOT NULL,
    "slug" VARCHAR(255) NOT NULL,
    "summary" TEXT,
    "description" TEXT,
    "phone" VARCHAR(64),
    "instagram" VARCHAR(255),
    "website" VARCHAR(255),
    "provinceId" BIGINT,
    "cityId" BIGINT,
    "neighborhoodId" BIGINT,
    "addressLine" TEXT,
    "postalCode" VARCHAR(32),
    "lat" DOUBLE PRECISION,
    "lng" DOUBLE PRECISION,
    "openingHoursId" BIGINT,
    "isWomenOnly" BOOLEAN,
    "priceTier" INTEGER,
    "avatarMediaId" BIGINT,
    "coverMediaId" BIGINT,
    "seoMetaId" BIGINT,
    "verification" "VerificationStatus" NOT NULL DEFAULT 'NONE',
    "status" "AccountStatus" NOT NULL DEFAULT 'ACTIVE',
    "primaryOwnerId" BIGINT,
    "avgRating" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "reviewCount" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "Salon_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OpeningHours" (
    "id" BIGSERIAL NOT NULL,
    "weeklyJson" TEXT NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "OpeningHours_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Artist" (
    "id" BIGSERIAL NOT NULL,
    "fullName" VARCHAR(255) NOT NULL,
    "slug" VARCHAR(255) NOT NULL,
    "summary" TEXT,
    "bio" TEXT,
    "phone" VARCHAR(64),
    "instagram" VARCHAR(255),
    "website" VARCHAR(255),
    "cityId" BIGINT,
    "neighborhoodId" BIGINT,
    "avatarMediaId" BIGINT,
    "coverMediaId" BIGINT,
    "seoMetaId" BIGINT,
    "verification" "VerificationStatus" NOT NULL DEFAULT 'NONE',
    "status" "AccountStatus" NOT NULL DEFAULT 'ACTIVE',
    "primaryOwnerId" BIGINT,
    "avgRating" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "reviewCount" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "Artist_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ArtistCertification" (
    "id" BIGSERIAL NOT NULL,
    "artistId" BIGINT NOT NULL,
    "title" VARCHAR(255) NOT NULL,
    "issuer" VARCHAR(255) NOT NULL,
    "issuerSlug" VARCHAR(128),
    "category" VARCHAR(64),
    "level" VARCHAR(64),
    "issuedAt" TIMESTAMP(3),
    "expiresAt" TIMESTAMP(3),
    "credentialId" VARCHAR(128),
    "credentialUrl" TEXT,
    "mediaId" BIGINT,
    "isVerified" BOOLEAN NOT NULL DEFAULT false,
    "verifiedAt" TIMESTAMP(3),
    "verifiedById" BIGINT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ArtistCertification_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SalonArtist" (
    "id" BIGSERIAL NOT NULL,
    "salonId" BIGINT NOT NULL,
    "artistId" BIGINT NOT NULL,
    "roleTitle" VARCHAR(255),
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "startedAt" TIMESTAMP(3),
    "endedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SalonArtist_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ServiceCategory" (
    "id" BIGSERIAL NOT NULL,
    "nameFa" VARCHAR(255) NOT NULL,
    "slug" VARCHAR(128) NOT NULL,
    "order" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "ServiceCategory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ServiceDefinition" (
    "id" BIGSERIAL NOT NULL,
    "categoryId" BIGINT NOT NULL,
    "nameFa" VARCHAR(255) NOT NULL,
    "slug" VARCHAR(128) NOT NULL,
    "description" TEXT,

    CONSTRAINT "ServiceDefinition_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SalonService" (
    "id" BIGSERIAL NOT NULL,
    "salonId" BIGINT NOT NULL,
    "serviceId" BIGINT NOT NULL,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SalonService_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Specialty" (
    "id" BIGSERIAL NOT NULL,
    "nameFa" VARCHAR(255) NOT NULL,
    "slug" VARCHAR(128) NOT NULL,
    "order" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "Specialty_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ArtistSpecialty" (
    "id" BIGSERIAL NOT NULL,
    "artistId" BIGINT NOT NULL,
    "specialtyId" BIGINT NOT NULL,

    CONSTRAINT "ArtistSpecialty_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Review" (
    "id" BIGSERIAL NOT NULL,
    "authorId" BIGINT NOT NULL,
    "salonId" BIGINT,
    "artistId" BIGINT,
    "rating" INTEGER NOT NULL,
    "title" VARCHAR(255),
    "body" TEXT,
    "status" "ReviewStatus" NOT NULL DEFAULT 'PUBLISHED',
    "visitedAt" TIMESTAMP(3),
    "ip" VARCHAR(45),
    "userAgent" VARCHAR(255),
    "likeCount" INTEGER NOT NULL DEFAULT 0,
    "dislikeCount" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "Review_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ReviewVote" (
    "id" BIGSERIAL NOT NULL,
    "userId" BIGINT NOT NULL,
    "reviewId" BIGINT NOT NULL,
    "isLike" BOOLEAN NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ReviewVote_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Report" (
    "id" BIGSERIAL NOT NULL,
    "reporterId" BIGINT NOT NULL,
    "targetType" "EntityType" NOT NULL,
    "targetId" BIGINT NOT NULL,
    "salonId" BIGINT,
    "artistId" BIGINT,
    "reviewId" BIGINT,
    "reason" VARCHAR(255) NOT NULL,
    "details" TEXT,
    "status" "ReportStatus" NOT NULL DEFAULT 'OPEN',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Report_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "VerificationRequest" (
    "id" BIGSERIAL NOT NULL,
    "requestedById" BIGINT NOT NULL,
    "salonId" BIGINT,
    "artistId" BIGINT,
    "status" "VerificationStatus" NOT NULL DEFAULT 'PENDING',
    "notes" TEXT,
    "reviewedById" BIGINT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "VerificationRequest_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "VerificationDocument" (
    "id" BIGSERIAL NOT NULL,
    "verificationRequestId" BIGINT NOT NULL,
    "mediaId" BIGINT NOT NULL,
    "label" VARCHAR(255),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "VerificationDocument_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Follow" (
    "id" BIGSERIAL NOT NULL,
    "followerId" BIGINT NOT NULL,
    "targetType" "FollowTargetType" NOT NULL,
    "salonId" BIGINT,
    "artistId" BIGINT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Follow_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Save" (
    "id" BIGSERIAL NOT NULL,
    "userId" BIGINT NOT NULL,
    "targetType" "SaveTargetType" NOT NULL,
    "salonId" BIGINT,
    "artistId" BIGINT,
    "postId" BIGINT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Save_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "_SalonOwners" (
    "A" BIGINT NOT NULL,
    "B" BIGINT NOT NULL
);

-- CreateTable
CREATE TABLE "_ArtistOwners" (
    "A" BIGINT NOT NULL,
    "B" BIGINT NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "users_user_username_key" ON "users_user"("username");

-- CreateIndex
CREATE UNIQUE INDEX "users_user_phone_number_key" ON "users_user"("phone_number");

-- CreateIndex
CREATE UNIQUE INDEX "users_user_referral_code_key" ON "users_user"("referral_code");

-- CreateIndex
CREATE INDEX "users_user_cityId_idx" ON "users_user"("cityId");

-- CreateIndex
CREATE INDEX "users_user_role_status_idx" ON "users_user"("role", "status");

-- CreateIndex
CREATE INDEX "OtpAttempt_phoneE164_createdAt_idx" ON "OtpAttempt"("phoneE164", "createdAt");

-- CreateIndex
CREATE INDEX "OtpAttempt_userId_createdAt_idx" ON "OtpAttempt"("userId", "createdAt");

-- CreateIndex
CREATE INDEX "blog_media_uploaded_by_id_idx" ON "blog_media"("uploaded_by_id");

-- CreateIndex
CREATE INDEX "blog_media_created_at_idx" ON "blog_media"("created_at");

-- CreateIndex
CREATE INDEX "blog_media_entityType_entityId_idx" ON "blog_media"("entityType", "entityId");

-- CreateIndex
CREATE INDEX "blog_authorprofile_avatar_id_idx" ON "blog_authorprofile"("avatar_id");

-- CreateIndex
CREATE UNIQUE INDEX "blog_category_slug_key" ON "blog_category"("slug");

-- CreateIndex
CREATE INDEX "blog_category_parent_id_idx" ON "blog_category"("parent_id");

-- CreateIndex
CREATE INDEX "blog_category_order_idx" ON "blog_category"("order");

-- CreateIndex
CREATE INDEX "blog_category_seoMetaId_idx" ON "blog_category"("seoMetaId");

-- CreateIndex
CREATE UNIQUE INDEX "blog_tag_slug_key" ON "blog_tag"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "blog_series_slug_key" ON "blog_series"("slug");

-- CreateIndex
CREATE INDEX "blog_series_order_strategy_idx" ON "blog_series"("order_strategy");

-- CreateIndex
CREATE UNIQUE INDEX "blog_post_slug_key" ON "blog_post"("slug");

-- CreateIndex
CREATE INDEX "blog_post_published_at_idx" ON "blog_post"("published_at");

-- CreateIndex
CREATE INDEX "blog_post_status_visibility_published_at_idx" ON "blog_post"("status", "visibility", "published_at");

-- CreateIndex
CREATE INDEX "blog_post_author_id_published_at_idx" ON "blog_post"("author_id", "published_at");

-- CreateIndex
CREATE INDEX "blog_post_category_id_published_at_idx" ON "blog_post"("category_id", "published_at");

-- CreateIndex
CREATE INDEX "blog_post_series_id_published_at_idx" ON "blog_post"("series_id", "published_at");

-- CreateIndex
CREATE INDEX "blog_post_scheduled_at_idx" ON "blog_post"("scheduled_at");

-- CreateIndex
CREATE INDEX "blog_post_is_hot_idx" ON "blog_post"("is_hot");

-- CreateIndex
CREATE INDEX "blog_post_seoMetaId_idx" ON "blog_post"("seoMetaId");

-- CreateIndex
CREATE INDEX "blog_posttag_tag_id_idx" ON "blog_posttag"("tag_id");

-- CreateIndex
CREATE INDEX "blog_posttag_post_id_idx" ON "blog_posttag"("post_id");

-- CreateIndex
CREATE UNIQUE INDEX "blog_posttag_post_id_tag_id_key" ON "blog_posttag"("post_id", "tag_id");

-- CreateIndex
CREATE INDEX "blog_revision_post_id_created_at_idx" ON "blog_revision"("post_id", "created_at");

-- CreateIndex
CREATE INDEX "blog_revision_editor_id_created_at_idx" ON "blog_revision"("editor_id", "created_at");

-- CreateIndex
CREATE INDEX "blog_comment_post_id_created_at_idx" ON "blog_comment"("post_id", "created_at");

-- CreateIndex
CREATE INDEX "blog_comment_status_created_at_idx" ON "blog_comment"("status", "created_at");

-- CreateIndex
CREATE INDEX "blog_comment_parent_id_idx" ON "blog_comment"("parent_id");

-- CreateIndex
CREATE INDEX "blog_reaction_content_type_id_object_id_idx" ON "blog_reaction"("content_type_id", "object_id");

-- CreateIndex
CREATE INDEX "blog_reaction_user_id_created_at_idx" ON "blog_reaction"("user_id", "created_at");

-- CreateIndex
CREATE UNIQUE INDEX "blog_reaction_user_id_content_type_id_object_id_reaction_key" ON "blog_reaction"("user_id", "content_type_id", "object_id", "reaction");

-- CreateIndex
CREATE UNIQUE INDEX "blog_page_slug_key" ON "blog_page"("slug");

-- CreateIndex
CREATE INDEX "blog_page_status_published_at_idx" ON "blog_page"("status", "published_at");

-- CreateIndex
CREATE INDEX "blog_page_seoMetaId_idx" ON "blog_page"("seoMetaId");

-- CreateIndex
CREATE UNIQUE INDEX "blog_menu_location_key" ON "blog_menu"("location");

-- CreateIndex
CREATE INDEX "blog_menuitem_menu_id_order_idx" ON "blog_menuitem"("menu_id", "order");

-- CreateIndex
CREATE INDEX "blog_menuitem_parent_id_idx" ON "blog_menuitem"("parent_id");

-- CreateIndex
CREATE INDEX "blog_postmedia_media_id_idx" ON "blog_postmedia"("media_id");

-- CreateIndex
CREATE INDEX "blog_postmedia_post_id_idx" ON "blog_postmedia"("post_id");

-- CreateIndex
CREATE UNIQUE INDEX "blog_postmedia_post_id_media_id_attachment_type_key" ON "blog_postmedia"("post_id", "media_id", "attachment_type");

-- CreateIndex
CREATE INDEX "SeoMeta_entityType_idx" ON "SeoMeta"("entityType");

-- CreateIndex
CREATE UNIQUE INDEX "SeoMeta_entityType_entityId_key" ON "SeoMeta"("entityType", "entityId");

-- CreateIndex
CREATE INDEX "SlugHistory_entityType_oldSlug_idx" ON "SlugHistory"("entityType", "oldSlug");

-- CreateIndex
CREATE INDEX "SlugHistory_entityType_entityId_changedAt_idx" ON "SlugHistory"("entityType", "entityId", "changedAt");

-- CreateIndex
CREATE UNIQUE INDEX "RedirectRule_fromPath_key" ON "RedirectRule"("fromPath");

-- CreateIndex
CREATE INDEX "RedirectRule_isActive_idx" ON "RedirectRule"("isActive");

-- CreateIndex
CREATE UNIQUE INDEX "SitemapUrl_path_key" ON "SitemapUrl"("path");

-- CreateIndex
CREATE INDEX "SitemapUrl_isEnabled_idx" ON "SitemapUrl"("isEnabled");

-- CreateIndex
CREATE INDEX "SitemapUrl_entityType_entityId_idx" ON "SitemapUrl"("entityType", "entityId");

-- CreateIndex
CREATE UNIQUE INDEX "Province_slug_key" ON "Province"("slug");

-- CreateIndex
CREATE INDEX "Province_nameFa_idx" ON "Province"("nameFa");

-- CreateIndex
CREATE INDEX "Province_seoMetaId_idx" ON "Province"("seoMetaId");

-- CreateIndex
CREATE INDEX "City_nameFa_idx" ON "City"("nameFa");

-- CreateIndex
CREATE INDEX "City_seoMetaId_idx" ON "City"("seoMetaId");

-- CreateIndex
CREATE UNIQUE INDEX "City_provinceId_slug_key" ON "City"("provinceId", "slug");

-- CreateIndex
CREATE INDEX "Neighborhood_cityId_idx" ON "Neighborhood"("cityId");

-- CreateIndex
CREATE UNIQUE INDEX "Neighborhood_cityId_slug_key" ON "Neighborhood"("cityId", "slug");

-- CreateIndex
CREATE UNIQUE INDEX "Salon_slug_key" ON "Salon"("slug");

-- CreateIndex
CREATE INDEX "Salon_cityId_neighborhoodId_status_idx" ON "Salon"("cityId", "neighborhoodId", "status");

-- CreateIndex
CREATE INDEX "Salon_verification_idx" ON "Salon"("verification");

-- CreateIndex
CREATE INDEX "Salon_seoMetaId_idx" ON "Salon"("seoMetaId");

-- CreateIndex
CREATE UNIQUE INDEX "Artist_slug_key" ON "Artist"("slug");

-- CreateIndex
CREATE INDEX "Artist_cityId_neighborhoodId_status_idx" ON "Artist"("cityId", "neighborhoodId", "status");

-- CreateIndex
CREATE INDEX "Artist_verification_idx" ON "Artist"("verification");

-- CreateIndex
CREATE INDEX "Artist_seoMetaId_idx" ON "Artist"("seoMetaId");

-- CreateIndex
CREATE INDEX "ArtistCertification_artistId_idx" ON "ArtistCertification"("artistId");

-- CreateIndex
CREATE INDEX "ArtistCertification_issuerSlug_idx" ON "ArtistCertification"("issuerSlug");

-- CreateIndex
CREATE INDEX "ArtistCertification_isVerified_idx" ON "ArtistCertification"("isVerified");

-- CreateIndex
CREATE INDEX "SalonArtist_salonId_isActive_idx" ON "SalonArtist"("salonId", "isActive");

-- CreateIndex
CREATE INDEX "SalonArtist_artistId_isActive_idx" ON "SalonArtist"("artistId", "isActive");

-- CreateIndex
CREATE UNIQUE INDEX "SalonArtist_salonId_artistId_key" ON "SalonArtist"("salonId", "artistId");

-- CreateIndex
CREATE UNIQUE INDEX "ServiceCategory_slug_key" ON "ServiceCategory"("slug");

-- CreateIndex
CREATE INDEX "ServiceCategory_order_idx" ON "ServiceCategory"("order");

-- CreateIndex
CREATE UNIQUE INDEX "ServiceDefinition_slug_key" ON "ServiceDefinition"("slug");

-- CreateIndex
CREATE INDEX "ServiceDefinition_categoryId_idx" ON "ServiceDefinition"("categoryId");

-- CreateIndex
CREATE INDEX "SalonService_salonId_idx" ON "SalonService"("salonId");

-- CreateIndex
CREATE INDEX "SalonService_serviceId_idx" ON "SalonService"("serviceId");

-- CreateIndex
CREATE UNIQUE INDEX "SalonService_salonId_serviceId_key" ON "SalonService"("salonId", "serviceId");

-- CreateIndex
CREATE UNIQUE INDEX "Specialty_slug_key" ON "Specialty"("slug");

-- CreateIndex
CREATE INDEX "Specialty_order_idx" ON "Specialty"("order");

-- CreateIndex
CREATE INDEX "ArtistSpecialty_specialtyId_idx" ON "ArtistSpecialty"("specialtyId");

-- CreateIndex
CREATE UNIQUE INDEX "ArtistSpecialty_artistId_specialtyId_key" ON "ArtistSpecialty"("artistId", "specialtyId");

-- CreateIndex
CREATE INDEX "Review_authorId_createdAt_idx" ON "Review"("authorId", "createdAt");

-- CreateIndex
CREATE INDEX "Review_salonId_status_createdAt_idx" ON "Review"("salonId", "status", "createdAt");

-- CreateIndex
CREATE INDEX "Review_artistId_status_createdAt_idx" ON "Review"("artistId", "status", "createdAt");

-- CreateIndex
CREATE INDEX "ReviewVote_reviewId_isLike_idx" ON "ReviewVote"("reviewId", "isLike");

-- CreateIndex
CREATE UNIQUE INDEX "ReviewVote_userId_reviewId_key" ON "ReviewVote"("userId", "reviewId");

-- CreateIndex
CREATE INDEX "Report_targetType_targetId_status_idx" ON "Report"("targetType", "targetId", "status");

-- CreateIndex
CREATE INDEX "Report_reporterId_createdAt_idx" ON "Report"("reporterId", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "VerificationRequest_salonId_key" ON "VerificationRequest"("salonId");

-- CreateIndex
CREATE UNIQUE INDEX "VerificationRequest_artistId_key" ON "VerificationRequest"("artistId");

-- CreateIndex
CREATE INDEX "VerificationRequest_status_createdAt_idx" ON "VerificationRequest"("status", "createdAt");

-- CreateIndex
CREATE INDEX "VerificationRequest_requestedById_createdAt_idx" ON "VerificationRequest"("requestedById", "createdAt");

-- CreateIndex
CREATE INDEX "VerificationDocument_verificationRequestId_idx" ON "VerificationDocument"("verificationRequestId");

-- CreateIndex
CREATE INDEX "VerificationDocument_mediaId_idx" ON "VerificationDocument"("mediaId");

-- CreateIndex
CREATE INDEX "Follow_targetType_createdAt_idx" ON "Follow"("targetType", "createdAt");

-- CreateIndex
CREATE INDEX "Follow_followerId_createdAt_idx" ON "Follow"("followerId", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "Follow_followerId_targetType_salonId_artistId_key" ON "Follow"("followerId", "targetType", "salonId", "artistId");

-- CreateIndex
CREATE INDEX "Save_userId_createdAt_idx" ON "Save"("userId", "createdAt");

-- CreateIndex
CREATE INDEX "Save_targetType_createdAt_idx" ON "Save"("targetType", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "Save_userId_targetType_salonId_artistId_postId_key" ON "Save"("userId", "targetType", "salonId", "artistId", "postId");

-- CreateIndex
CREATE UNIQUE INDEX "_SalonOwners_AB_unique" ON "_SalonOwners"("A", "B");

-- CreateIndex
CREATE INDEX "_SalonOwners_B_index" ON "_SalonOwners"("B");

-- CreateIndex
CREATE UNIQUE INDEX "_ArtistOwners_AB_unique" ON "_ArtistOwners"("A", "B");

-- CreateIndex
CREATE INDEX "_ArtistOwners_B_index" ON "_ArtistOwners"("B");

-- AddForeignKey
ALTER TABLE "users_user" ADD CONSTRAINT "users_user_cityId_fkey" FOREIGN KEY ("cityId") REFERENCES "City"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OtpAttempt" ADD CONSTRAINT "OtpAttempt_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users_user"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "blog_media" ADD CONSTRAINT "blog_media_uploaded_by_id_fkey" FOREIGN KEY ("uploaded_by_id") REFERENCES "users_user"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "blog_authorprofile" ADD CONSTRAINT "blog_authorprofile_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users_user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "blog_authorprofile" ADD CONSTRAINT "blog_authorprofile_avatar_id_fkey" FOREIGN KEY ("avatar_id") REFERENCES "blog_media"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "blog_category" ADD CONSTRAINT "blog_category_seoMetaId_fkey" FOREIGN KEY ("seoMetaId") REFERENCES "SeoMeta"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "blog_category" ADD CONSTRAINT "blog_category_parent_id_fkey" FOREIGN KEY ("parent_id") REFERENCES "blog_category"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "blog_post" ADD CONSTRAINT "blog_post_seoMetaId_fkey" FOREIGN KEY ("seoMetaId") REFERENCES "SeoMeta"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "blog_post" ADD CONSTRAINT "blog_post_author_id_fkey" FOREIGN KEY ("author_id") REFERENCES "blog_authorprofile"("user_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "blog_post" ADD CONSTRAINT "blog_post_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "blog_category"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "blog_post" ADD CONSTRAINT "blog_post_series_id_fkey" FOREIGN KEY ("series_id") REFERENCES "blog_series"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "blog_post" ADD CONSTRAINT "blog_post_cover_media_id_fkey" FOREIGN KEY ("cover_media_id") REFERENCES "blog_media"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "blog_post" ADD CONSTRAINT "blog_post_og_image_id_fkey" FOREIGN KEY ("og_image_id") REFERENCES "blog_media"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "blog_posttag" ADD CONSTRAINT "blog_posttag_post_id_fkey" FOREIGN KEY ("post_id") REFERENCES "blog_post"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "blog_posttag" ADD CONSTRAINT "blog_posttag_tag_id_fkey" FOREIGN KEY ("tag_id") REFERENCES "blog_tag"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "blog_revision" ADD CONSTRAINT "blog_revision_post_id_fkey" FOREIGN KEY ("post_id") REFERENCES "blog_post"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "blog_revision" ADD CONSTRAINT "blog_revision_editor_id_fkey" FOREIGN KEY ("editor_id") REFERENCES "users_user"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "blog_comment" ADD CONSTRAINT "blog_comment_post_id_fkey" FOREIGN KEY ("post_id") REFERENCES "blog_post"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "blog_comment" ADD CONSTRAINT "blog_comment_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users_user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "blog_comment" ADD CONSTRAINT "blog_comment_parent_id_fkey" FOREIGN KEY ("parent_id") REFERENCES "blog_comment"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "blog_reaction" ADD CONSTRAINT "blog_reaction_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users_user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "blog_page" ADD CONSTRAINT "blog_page_seoMetaId_fkey" FOREIGN KEY ("seoMetaId") REFERENCES "SeoMeta"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "blog_menuitem" ADD CONSTRAINT "blog_menuitem_menu_id_fkey" FOREIGN KEY ("menu_id") REFERENCES "blog_menu"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "blog_menuitem" ADD CONSTRAINT "blog_menuitem_parent_id_fkey" FOREIGN KEY ("parent_id") REFERENCES "blog_menuitem"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "blog_postmedia" ADD CONSTRAINT "blog_postmedia_post_id_fkey" FOREIGN KEY ("post_id") REFERENCES "blog_post"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "blog_postmedia" ADD CONSTRAINT "blog_postmedia_media_id_fkey" FOREIGN KEY ("media_id") REFERENCES "blog_media"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SeoMeta" ADD CONSTRAINT "SeoMeta_ogImageMediaId_fkey" FOREIGN KEY ("ogImageMediaId") REFERENCES "blog_media"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SeoMeta" ADD CONSTRAINT "SeoMeta_twitterImageMediaId_fkey" FOREIGN KEY ("twitterImageMediaId") REFERENCES "blog_media"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Province" ADD CONSTRAINT "Province_seoMetaId_fkey" FOREIGN KEY ("seoMetaId") REFERENCES "SeoMeta"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "City" ADD CONSTRAINT "City_provinceId_fkey" FOREIGN KEY ("provinceId") REFERENCES "Province"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "City" ADD CONSTRAINT "City_seoMetaId_fkey" FOREIGN KEY ("seoMetaId") REFERENCES "SeoMeta"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Neighborhood" ADD CONSTRAINT "Neighborhood_cityId_fkey" FOREIGN KEY ("cityId") REFERENCES "City"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Salon" ADD CONSTRAINT "Salon_cityId_fkey" FOREIGN KEY ("cityId") REFERENCES "City"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Salon" ADD CONSTRAINT "Salon_neighborhoodId_fkey" FOREIGN KEY ("neighborhoodId") REFERENCES "Neighborhood"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Salon" ADD CONSTRAINT "Salon_openingHoursId_fkey" FOREIGN KEY ("openingHoursId") REFERENCES "OpeningHours"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Salon" ADD CONSTRAINT "Salon_avatarMediaId_fkey" FOREIGN KEY ("avatarMediaId") REFERENCES "blog_media"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Salon" ADD CONSTRAINT "Salon_coverMediaId_fkey" FOREIGN KEY ("coverMediaId") REFERENCES "blog_media"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Salon" ADD CONSTRAINT "Salon_seoMetaId_fkey" FOREIGN KEY ("seoMetaId") REFERENCES "SeoMeta"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Salon" ADD CONSTRAINT "Salon_primaryOwnerId_fkey" FOREIGN KEY ("primaryOwnerId") REFERENCES "users_user"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Artist" ADD CONSTRAINT "Artist_cityId_fkey" FOREIGN KEY ("cityId") REFERENCES "City"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Artist" ADD CONSTRAINT "Artist_neighborhoodId_fkey" FOREIGN KEY ("neighborhoodId") REFERENCES "Neighborhood"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Artist" ADD CONSTRAINT "Artist_avatarMediaId_fkey" FOREIGN KEY ("avatarMediaId") REFERENCES "blog_media"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Artist" ADD CONSTRAINT "Artist_coverMediaId_fkey" FOREIGN KEY ("coverMediaId") REFERENCES "blog_media"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Artist" ADD CONSTRAINT "Artist_seoMetaId_fkey" FOREIGN KEY ("seoMetaId") REFERENCES "SeoMeta"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Artist" ADD CONSTRAINT "Artist_primaryOwnerId_fkey" FOREIGN KEY ("primaryOwnerId") REFERENCES "users_user"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ArtistCertification" ADD CONSTRAINT "ArtistCertification_artistId_fkey" FOREIGN KEY ("artistId") REFERENCES "Artist"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ArtistCertification" ADD CONSTRAINT "ArtistCertification_mediaId_fkey" FOREIGN KEY ("mediaId") REFERENCES "blog_media"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ArtistCertification" ADD CONSTRAINT "ArtistCertification_verifiedById_fkey" FOREIGN KEY ("verifiedById") REFERENCES "users_user"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SalonArtist" ADD CONSTRAINT "SalonArtist_salonId_fkey" FOREIGN KEY ("salonId") REFERENCES "Salon"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SalonArtist" ADD CONSTRAINT "SalonArtist_artistId_fkey" FOREIGN KEY ("artistId") REFERENCES "Artist"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ServiceDefinition" ADD CONSTRAINT "ServiceDefinition_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "ServiceCategory"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SalonService" ADD CONSTRAINT "SalonService_salonId_fkey" FOREIGN KEY ("salonId") REFERENCES "Salon"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SalonService" ADD CONSTRAINT "SalonService_serviceId_fkey" FOREIGN KEY ("serviceId") REFERENCES "ServiceDefinition"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ArtistSpecialty" ADD CONSTRAINT "ArtistSpecialty_artistId_fkey" FOREIGN KEY ("artistId") REFERENCES "Artist"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ArtistSpecialty" ADD CONSTRAINT "ArtistSpecialty_specialtyId_fkey" FOREIGN KEY ("specialtyId") REFERENCES "Specialty"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Review" ADD CONSTRAINT "Review_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "users_user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Review" ADD CONSTRAINT "Review_salonId_fkey" FOREIGN KEY ("salonId") REFERENCES "Salon"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Review" ADD CONSTRAINT "Review_artistId_fkey" FOREIGN KEY ("artistId") REFERENCES "Artist"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReviewVote" ADD CONSTRAINT "ReviewVote_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users_user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReviewVote" ADD CONSTRAINT "ReviewVote_reviewId_fkey" FOREIGN KEY ("reviewId") REFERENCES "Review"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Report" ADD CONSTRAINT "Report_reporterId_fkey" FOREIGN KEY ("reporterId") REFERENCES "users_user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Report" ADD CONSTRAINT "Report_salonId_fkey" FOREIGN KEY ("salonId") REFERENCES "Salon"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Report" ADD CONSTRAINT "Report_artistId_fkey" FOREIGN KEY ("artistId") REFERENCES "Artist"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Report" ADD CONSTRAINT "Report_reviewId_fkey" FOREIGN KEY ("reviewId") REFERENCES "Review"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VerificationRequest" ADD CONSTRAINT "VerificationRequest_requestedById_fkey" FOREIGN KEY ("requestedById") REFERENCES "users_user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VerificationRequest" ADD CONSTRAINT "VerificationRequest_salonId_fkey" FOREIGN KEY ("salonId") REFERENCES "Salon"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VerificationRequest" ADD CONSTRAINT "VerificationRequest_artistId_fkey" FOREIGN KEY ("artistId") REFERENCES "Artist"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VerificationRequest" ADD CONSTRAINT "VerificationRequest_reviewedById_fkey" FOREIGN KEY ("reviewedById") REFERENCES "users_user"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VerificationDocument" ADD CONSTRAINT "VerificationDocument_verificationRequestId_fkey" FOREIGN KEY ("verificationRequestId") REFERENCES "VerificationRequest"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VerificationDocument" ADD CONSTRAINT "VerificationDocument_mediaId_fkey" FOREIGN KEY ("mediaId") REFERENCES "blog_media"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Follow" ADD CONSTRAINT "Follow_followerId_fkey" FOREIGN KEY ("followerId") REFERENCES "users_user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Follow" ADD CONSTRAINT "Follow_salonId_fkey" FOREIGN KEY ("salonId") REFERENCES "Salon"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Follow" ADD CONSTRAINT "Follow_artistId_fkey" FOREIGN KEY ("artistId") REFERENCES "Artist"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Save" ADD CONSTRAINT "Save_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users_user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Save" ADD CONSTRAINT "Save_salonId_fkey" FOREIGN KEY ("salonId") REFERENCES "Salon"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Save" ADD CONSTRAINT "Save_artistId_fkey" FOREIGN KEY ("artistId") REFERENCES "Artist"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Save" ADD CONSTRAINT "Save_postId_fkey" FOREIGN KEY ("postId") REFERENCES "blog_post"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_SalonOwners" ADD CONSTRAINT "_SalonOwners_A_fkey" FOREIGN KEY ("A") REFERENCES "Salon"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_SalonOwners" ADD CONSTRAINT "_SalonOwners_B_fkey" FOREIGN KEY ("B") REFERENCES "users_user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_ArtistOwners" ADD CONSTRAINT "_ArtistOwners_A_fkey" FOREIGN KEY ("A") REFERENCES "Artist"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_ArtistOwners" ADD CONSTRAINT "_ArtistOwners_B_fkey" FOREIGN KEY ("B") REFERENCES "users_user"("id") ON DELETE CASCADE ON UPDATE CASCADE;
