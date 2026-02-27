-- AlterTable
ALTER TABLE "SalonService" ADD COLUMN     "minPriceToman" BIGINT NOT NULL DEFAULT 0,
ADD COLUMN     "maxPriceToman" BIGINT NOT NULL DEFAULT 0,
ADD COLUMN     "minDurationMin" INTEGER,
ADD COLUMN     "maxDurationMin" INTEGER;

-- Migrate existing data
UPDATE "SalonService" SET "minPriceToman" = COALESCE("priceToman", 0);
UPDATE "SalonService" SET "maxPriceToman" = COALESCE("priceToman", 0);
UPDATE "SalonService" SET "minDurationMin" = "durationMin";
UPDATE "SalonService" SET "maxDurationMin" = "durationMin";
