import { PrismaClient, PlanTier, EntityType } from '@prisma/client';
import { UserGenerator } from './generators/user-generator';
import { SalonGenerator } from './generators/salon-generator';
import { BlogGenerator } from './generators/blog-generator';
import { ReviewGenerator } from './generators/review-generator';

const prisma = new PrismaClient();

export async function orchestrateSeeding(volume: 'small' | 'medium' | 'large' | 'stress' = 'small') {
  console.log(`🚀 Starting production-grade seeding with volume: ${volume.toUpperCase()}`);

  const counts = {
    small: { users: 10, salons: 5, posts: 5, reviews: 20 },
    medium: { users: 100, salons: 50, posts: 20, reviews: 200 },
    large: { users: 1000, salons: 200, posts: 100, reviews: 2000 },
    stress: { users: 5000, salons: 1000, posts: 500, reviews: 10000 },
  }[volume];

  // 1. Independent Level 0
  await seedIndependentData();

  // 2. Generators
  const userGen = new UserGenerator(prisma);
  await userGen.createSpecialUsers();
  await userGen.seed(counts.users);

  // Author profile for the special editor
  const editor = await prisma.user.findUnique({ where: { username: 'editor_primary' } });
  if (editor) {
    await prisma.authorProfile.upsert({
      where: { userId: editor.id },
      update: {},
      create: {
        userId: editor.id,
        displayName: 'الناز کریمی (سردبیر)',
        bio: 'متخصص زیبایی و نویسنده برتر در حوزه مد و فشن.',
      }
    });
  }

  const salonGen = new SalonGenerator(prisma);
  await salonGen.seed(counts.salons);

  const blogGen = new BlogGenerator(prisma);
  await blogGen.seed(counts.posts);

  const reviewGen = new ReviewGenerator(prisma);
  await reviewGen.seed(counts.reviews);

  console.log('✅ Seeding completed successfully.');
}

async function seedIndependentData() {
  console.log('--- Seeding Geography & Plans ---');

  // Province & City
  const tehranProvince = await prisma.province.upsert({
    where: { slug: 'tehran-province' },
    update: {},
    create: { nameFa: 'تهران', slug: 'tehran-province' }
  });

  await prisma.city.upsert({
    where: { provinceId_slug: { provinceId: tehranProvince.id, slug: 'tehran' } },
    update: {},
    create: {
      provinceId: tehranProvince.id,
      nameFa: 'تهران',
      nameEn: 'Tehran',
      slug: 'tehran',
      lat: 35.6892,
      lng: 51.3890,
    }
  });

  // Plans
  const plans = [
    { name: 'طرح رایگان', tier: PlanTier.FREE, price: 0n },
    { name: 'طرح برنزی', tier: PlanTier.PRO, price: 1500000n },
    { name: 'طرح طلایی', tier: PlanTier.VIP, price: 5000000n },
  ];

  for (const p of plans) {
    await prisma.plan.upsert({
      where: { id: BigInt(plans.indexOf(p) + 1) }, // Simplification for seeder idempotency
      update: {},
      create: {
        ...p,
        entityType: EntityType.SALON,
        durationDays: 30,
        features: {},
      }
    });
  }
}

if (require.main === module) {
  const volume = (process.argv[2] as any) || 'small';
  orchestrateSeeding(volume)
    .catch(console.error)
    .finally(() => prisma.$disconnect());
}
