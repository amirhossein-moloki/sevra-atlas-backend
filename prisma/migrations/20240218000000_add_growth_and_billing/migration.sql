-- CreateEnum
CREATE TYPE "PlanTier" AS ENUM ('FREE', 'PRO', 'VIP');

-- CreateEnum
CREATE TYPE "SubscriptionStatus" AS ENUM ('ACTIVE', 'EXPIRED', 'CANCELED', 'GRACE_PERIOD');

-- AlterEnum
ALTER TYPE "EntityType" ADD VALUE 'PLAN';
ALTER TYPE "EntityType" ADD VALUE 'SUBSCRIPTION';

-- AlterTable
ALTER TABLE "Artist" ADD COLUMN     "featured_until" TIMESTAMP(3),
ADD COLUMN     "plan_id" BIGINT,
ADD COLUMN     "subscription_status" "SubscriptionStatus" DEFAULT 'ACTIVE',
ADD COLUMN     "visibility_score" DOUBLE PRECISION NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE "Salon" ADD COLUMN     "featured_until" TIMESTAMP(3),
ADD COLUMN     "plan_id" BIGINT,
ADD COLUMN     "subscription_status" "SubscriptionStatus" DEFAULT 'ACTIVE',
ADD COLUMN     "visibility_score" DOUBLE PRECISION NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE "users_user" ADD COLUMN     "invited_by_id" BIGINT;

-- CreateTable
CREATE TABLE "billing_plan" (
    "id" BIGSERIAL NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "tier" "PlanTier" NOT NULL,
    "entityType" "EntityType" NOT NULL,
    "price" BIGINT NOT NULL DEFAULT 0,
    "duration_days" INTEGER NOT NULL DEFAULT 30,
    "features" JSONB NOT NULL DEFAULT '{}',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "billing_plan_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "billing_subscription" (
    "id" BIGSERIAL NOT NULL,
    "plan_id" BIGINT NOT NULL,
    "salon_id" BIGINT,
    "artist_id" BIGINT,
    "status" "SubscriptionStatus" NOT NULL DEFAULT 'ACTIVE',
    "start_date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "end_date" TIMESTAMP(3),
    "next_billing_date" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "billing_subscription_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "billing_history" (
    "id" BIGSERIAL NOT NULL,
    "subscription_id" BIGINT NOT NULL,
    "amount" BIGINT NOT NULL DEFAULT 0,
    "currency" VARCHAR(3) NOT NULL DEFAULT 'IRR',
    "payment_date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "payment_method" VARCHAR(50),
    "transaction_id" VARCHAR(255),
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "billing_history_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "growth_invite" (
    "id" BIGSERIAL NOT NULL,
    "inviter_id" BIGINT NOT NULL,
    "code" VARCHAR(50) NOT NULL,
    "max_uses" INTEGER NOT NULL DEFAULT 1,
    "used_count" INTEGER NOT NULL DEFAULT 0,
    "expires_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "growth_invite_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "billing_plan_change_log" (
    "id" BIGSERIAL NOT NULL,
    "targetType" "EntityType" NOT NULL,
    "targetId" BIGINT NOT NULL,
    "oldPlanId" BIGINT,
    "newPlanId" BIGINT NOT NULL,
    "changedBy" BIGINT,
    "reason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "billing_plan_change_log_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "analytics_event" (
    "id" BIGSERIAL NOT NULL,
    "eventType" TEXT NOT NULL,
    "entityType" "EntityType" NOT NULL,
    "entityId" BIGINT NOT NULL,
    "metadata" JSONB NOT NULL DEFAULT '{}',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "analytics_event_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "billing_subscription_salon_id_key" ON "billing_subscription"("salon_id");

-- CreateIndex
CREATE UNIQUE INDEX "billing_subscription_artist_id_key" ON "billing_subscription"("artist_id");

-- CreateIndex
CREATE INDEX "billing_subscription_status_idx" ON "billing_subscription"("status");

-- CreateIndex
CREATE INDEX "billing_subscription_end_date_idx" ON "billing_subscription"("end_date");

-- CreateIndex
CREATE UNIQUE INDEX "billing_history_transaction_id_key" ON "billing_history"("transaction_id");

-- CreateIndex
CREATE INDEX "billing_history_subscription_id_idx" ON "billing_history"("subscription_id");

-- CreateIndex
CREATE UNIQUE INDEX "growth_invite_code_key" ON "growth_invite"("code");

-- CreateIndex
CREATE INDEX "growth_invite_inviter_id_idx" ON "growth_invite"("inviter_id");

-- CreateIndex
CREATE INDEX "analytics_event_eventType_entityType_entityId_idx" ON "analytics_event"("eventType", "entityType", "entityId");

-- AddForeignKey
ALTER TABLE "users_user" ADD CONSTRAINT "users_user_invited_by_id_fkey" FOREIGN KEY ("invited_by_id") REFERENCES "users_user"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Salon" ADD CONSTRAINT "Salon_plan_id_fkey" FOREIGN KEY ("plan_id") REFERENCES "billing_plan"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Artist" ADD CONSTRAINT "Artist_plan_id_fkey" FOREIGN KEY ("plan_id") REFERENCES "billing_plan"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "billing_subscription" ADD CONSTRAINT "billing_subscription_plan_id_fkey" FOREIGN KEY ("plan_id") REFERENCES "billing_plan"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "billing_subscription" ADD CONSTRAINT "billing_subscription_salon_id_fkey" FOREIGN KEY ("salon_id") REFERENCES "Salon"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "billing_subscription" ADD CONSTRAINT "billing_subscription_artist_id_fkey" FOREIGN KEY ("artist_id") REFERENCES "Artist"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "billing_history" ADD CONSTRAINT "billing_history_subscription_id_fkey" FOREIGN KEY ("subscription_id") REFERENCES "billing_subscription"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "growth_invite" ADD CONSTRAINT "growth_invite_inviter_id_fkey" FOREIGN KEY ("inviter_id") REFERENCES "users_user"("id") ON DELETE CASCADE ON UPDATE CASCADE;
