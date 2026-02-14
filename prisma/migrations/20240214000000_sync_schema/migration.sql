-- CreateEnum
CREATE TYPE "MediaStatus" AS ENUM ('PENDING', 'PROCESSING', 'COMPLETED', 'FAILED');

-- AlterEnum
ALTER TYPE "EntityType" ADD VALUE 'TAG';
ALTER TYPE "EntityType" ADD VALUE 'SERIES';

-- CreateTable
CREATE TABLE "auth_otp" (
    "id" BIGSERIAL NOT NULL,
    "phoneE164" VARCHAR(32) NOT NULL,
    "code" VARCHAR(10) NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "auth_otp_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "auth_refreshtoken" (
    "id" BIGSERIAL NOT NULL,
    "userId" BIGINT NOT NULL,
    "token" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "auth_refreshtoken_pkey" PRIMARY KEY ("id")
);

-- AlterTable
ALTER TABLE "blog_media" ADD COLUMN "status" "MediaStatus" NOT NULL DEFAULT 'COMPLETED';
ALTER TABLE "blog_media" ADD COLUMN "variants" JSONB DEFAULT '{}';
ALTER TABLE "blog_media" ADD COLUMN "deleted_at" TIMESTAMP(3);

-- CreateIndex
CREATE UNIQUE INDEX "auth_otp_phoneE164_key" ON "auth_otp"("phoneE164");
CREATE INDEX "auth_otp_phoneE164_expiresAt_idx" ON "auth_otp"("phoneE164", "expiresAt");

-- CreateIndex
CREATE UNIQUE INDEX "auth_refreshtoken_token_key" ON "auth_refreshtoken"("token");
CREATE INDEX "auth_refreshtoken_userId_idx" ON "auth_refreshtoken"("userId");

-- AddForeignKey
ALTER TABLE "auth_refreshtoken" ADD CONSTRAINT "auth_refreshtoken_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users_user"("id") ON DELETE CASCADE ON UPDATE CASCADE;
