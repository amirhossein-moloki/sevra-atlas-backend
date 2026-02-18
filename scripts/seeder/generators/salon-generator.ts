import { PrismaClient, AccountStatus, VerificationStatus, PlanTier, EntityType, MediaStatus, MediaKind } from '@prisma/client';
import { BaseGenerator, getRandom } from './base';
import { SALON_NAME_PARTS, ADDRESS_STREETS } from '../data/source';
import { SalonSchema, validate } from '../utils/validation';
import { AssetService } from '../utils/asset-service';

export class SalonGenerator extends BaseGenerator {
  async seed(count: number): Promise<void> {
    this.log(`Seeding ${count} salons...`);

    const users = await this.prisma.user.findMany({ where: { role: 'USER' }, take: count });
    const plans = await this.prisma.plan.findMany({ where: { entityType: EntityType.SALON } });
    const city = await this.prisma.city.findFirst();

    if (!city) {
      this.log('Skipping: No city found. Geography must be seeded first.');
      return;
    }

    for (let i = 0; i < Math.min(count, users.length); i++) {
      const prefix = getRandom(SALON_NAME_PARTS.prefixes);
      const baseName = getRandom(SALON_NAME_PARTS.names);
      const name = `${prefix} ${baseName} ${i}`;
      const slug = name.replace(/ /g, '-').toLowerCase() + '-' + i;
      const street = getRandom(ADDRESS_STREETS);

      const asset = AssetService.getAsset(EntityType.SALON);
      const media = await this.prisma.media.create({
        data: {
          url: asset.url,
          storageKey: AssetService.generateStorageKey(asset.url),
          type: 'image/jpeg',
          mime: 'image/jpeg',
          width: asset.width,
          height: asset.height,
          sizeBytes: 500000,
          status: MediaStatus.COMPLETED,
          kind: MediaKind.COVER,
          entityType: EntityType.SALON,
        }
      });

      const plan = getRandom(plans) || { id: null };

      const salonData = {
        name,
        slug,
        cityId: city.id,
        addressLine: `${street}، کوچه ${i+1}، پلاک ${i*10 + 5}`,
        status: AccountStatus.ACTIVE,
        verification: VerificationStatus.VERIFIED,
        primaryOwnerId: users[i].id,
        planId: plan.id as bigint | null,
        coverMediaId: media.id,
        summary: `خدمات حرفه‌ای در سالن ${baseName}.`,
        description: `ما در ${name} با بهترین متریال و پرسنل آماده خدمت‌رسانی به شما عزیزان هستیم.`,
      };

      validate(SalonSchema, { name: salonData.name, slug: salonData.slug, status: salonData.status, verification: salonData.verification });

      await this.prisma.salon.upsert({
        where: { slug: salonData.slug },
        update: {},
        create: salonData,
      });
    }
  }
}
