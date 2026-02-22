-- AlterEnum
ALTER TYPE "EntityType" ADD VALUE 'SERVICE';

-- AlterTable
ALTER TABLE "Salon" ADD COLUMN IF NOT EXISTS "reviewCount" INTEGER NOT NULL DEFAULT 0;
-- Note: reviewCount already exists but index might be missing
CREATE INDEX IF NOT EXISTS "Salon_reviewCount_idx" ON "Salon"("reviewCount" DESC);

-- AlterTable
ALTER TABLE "Artist" ADD COLUMN IF NOT EXISTS "reviewCount" INTEGER NOT NULL DEFAULT 0;
CREATE INDEX IF NOT EXISTS "Artist_reviewCount_idx" ON "Artist"("reviewCount" DESC);

-- AlterTable
ALTER TABLE "ServiceDefinition" ADD COLUMN "seoMetaId" BIGINT;
CREATE INDEX "ServiceDefinition_seoMetaId_idx" ON "ServiceDefinition"("seoMetaId");

-- CreateTable
CREATE TABLE "PostService" (
    "postId" BIGINT NOT NULL,
    "serviceId" BIGINT NOT NULL,

    CONSTRAINT "PostService_pkey" PRIMARY KEY ("postId","serviceId")
);

-- CreateTable
CREATE TABLE "LeadEvent" (
    "id" BIGSERIAL NOT NULL,
    "eventType" VARCHAR(50) NOT NULL,
    "sourcePostId" BIGINT,
    "targetSalonId" BIGINT,
    "userId" BIGINT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "LeadEvent_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "PostService_serviceId_idx" ON "PostService"("serviceId");

-- CreateIndex
CREATE INDEX "LeadEvent_eventType_createdAt_idx" ON "LeadEvent"("eventType", "createdAt");

-- CreateIndex
CREATE INDEX "LeadEvent_sourcePostId_idx" ON "LeadEvent"("sourcePostId");

-- CreateIndex
CREATE INDEX "LeadEvent_targetSalonId_idx" ON "LeadEvent"("targetSalonId");

-- AddForeignKey
ALTER TABLE "ServiceDefinition" ADD CONSTRAINT "ServiceDefinition_seoMetaId_fkey" FOREIGN KEY ("seoMetaId") REFERENCES "SeoMeta"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PostService" ADD CONSTRAINT "PostService_postId_fkey" FOREIGN KEY ("postId") REFERENCES "blog_post"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PostService" ADD CONSTRAINT "PostService_serviceId_fkey" FOREIGN KEY ("serviceId") REFERENCES "ServiceDefinition"("id") ON DELETE CASCADE ON UPDATE CASCADE;
