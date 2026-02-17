-- AlterTable
ALTER TABLE "VerificationRequest" ADD COLUMN "deletedAt" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "billing_subscription" ADD COLUMN "deleted_at" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "billing_history" ADD COLUMN "deleted_at" TIMESTAMP(3);

-- CreateIndex
CREATE INDEX "users_user_deletedAt_idx" ON "users_user"("deletedAt");

-- CreateIndex
CREATE INDEX "Salon_visibility_score_idx" ON "Salon"("visibility_score" DESC);
CREATE INDEX "Salon_avgRating_idx" ON "Salon"("avgRating" DESC);
CREATE INDEX "Salon_deletedAt_idx" ON "Salon"("deletedAt");

-- CreateIndex
CREATE INDEX "Artist_visibility_score_idx" ON "Artist"("visibility_score" DESC);
CREATE INDEX "Artist_avgRating_idx" ON "Artist"("avgRating" DESC);
CREATE INDEX "Artist_deletedAt_idx" ON "Artist"("deletedAt");

-- CreateIndex
CREATE INDEX "Review_deletedAt_idx" ON "Review"("deletedAt");

-- CreateIndex
CREATE INDEX "VerificationRequest_deletedAt_idx" ON "VerificationRequest"("deletedAt");

-- CreateIndex
CREATE INDEX "blog_media_deleted_at_idx" ON "blog_media"("deleted_at");

-- CreateIndex
CREATE INDEX "blog_category_deleted_at_idx" ON "blog_category"("deleted_at");

-- CreateIndex
CREATE INDEX "blog_tag_deleted_at_idx" ON "blog_tag"("deleted_at");

-- CreateIndex
CREATE INDEX "blog_series_deleted_at_idx" ON "blog_series"("deleted_at");

-- CreateIndex
CREATE INDEX "blog_post_deleted_at_idx" ON "blog_post"("deleted_at");

-- CreateIndex
CREATE INDEX "blog_comment_deleted_at_idx" ON "blog_comment"("deleted_at");

-- CreateIndex
CREATE INDEX "blog_page_deleted_at_idx" ON "blog_page"("deleted_at");

-- CreateIndex
CREATE INDEX "ServiceCategory_deleted_at_idx" ON "ServiceCategory"("deleted_at");

-- CreateIndex
CREATE INDEX "ServiceDefinition_deleted_at_idx" ON "ServiceDefinition"("deleted_at");

-- CreateIndex
CREATE INDEX "Specialty_deleted_at_idx" ON "Specialty"("deleted_at");

-- CreateIndex
CREATE INDEX "billing_subscription_deleted_at_idx" ON "billing_subscription"("deleted_at");

-- CreateIndex
CREATE INDEX "billing_history_deleted_at_idx" ON "billing_history"("deleted_at");

-- CreateIndex
CREATE INDEX "analytics_event_createdAt_idx" ON "analytics_event"("createdAt");
