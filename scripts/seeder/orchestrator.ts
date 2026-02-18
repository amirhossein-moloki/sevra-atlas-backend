import { PrismaClient, UserRole, AccountStatus, EntityType, PlanTier, ReviewStatus, MediaStatus, MediaKind, PostStatus, PostVisibility, Gender, VerificationStatus } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import * as fs from 'fs';
import * as path from 'path';
import { slugify, randomInt, pickOne, pickMany, skew } from './utils/common';
import { printReport, TargetPlan } from './report';
import { introspectApi, getDbCounts } from './utils/introspection';
import { deriveTargets, SeedMode } from './utils/deriver';
import { UserSeedSchema, SalonSeedSchema } from './utils/validation';

const prisma = new PrismaClient();

// Load datasets
const datasetsPath = path.join(__dirname, 'datasets');
const namesFa = JSON.parse(fs.readFileSync(path.join(datasetsPath, 'names_fa.json'), 'utf-8')) as { firstNames: string[], lastNames: string[] };
const salonNames = JSON.parse(fs.readFileSync(path.join(datasetsPath, 'salon_names.json'), 'utf-8')) as { prefixes: string[], names: string[] };
const geoFa = JSON.parse(fs.readFileSync(path.join(datasetsPath, 'geo_fa.json'), 'utf-8')) as { province: string, cities: string[] }[];
const reviewsData = JSON.parse(fs.readFileSync(path.join(datasetsPath, 'reviews.json'), 'utf-8')) as { rating: number, text: string }[];
const mediaAssets = JSON.parse(fs.readFileSync(path.join(datasetsPath, 'media_assets.json'), 'utf-8')) as { salon: string[], artist: string[], blog: string[], backups: string[] };

async function main() {
  const isDryRun = process.argv.includes('--dry-run');
  const mode = (process.env.SEED_MODE as SeedMode) || 'UI_SMALL';

  const pagination = await introspectApi();
  const dbCounts = await getDbCounts(prisma);
  const derivedTargets = deriveTargets(pagination, mode);

  const plans: TargetPlan[] = derivedTargets.map(t => ({
    model: t.model,
    current: (dbCounts as any)[t.model] || 0,
    required: t.required,
    delta: Math.max(0, t.required - ((dbCounts as any)[t.model] || 0)),
    justification: t.justification
  }));

  if (isDryRun) {
    printReport(plans, mode);
    return;
  }

  console.log(`Starting deterministic, idempotent seed process [${mode}]...`);

  // 1. Geography
  console.log('Seeding Geography...');
  for (const provData of geoFa) {
    const province = await prisma.province.upsert({
      where: { slug: slugify(provData.province) + '-province' },
      update: {},
      create: { nameFa: provData.province, slug: slugify(provData.province) + '-province' }
    });
    for (const cityName of provData.cities) {
      await prisma.city.upsert({
        where: { provinceId_slug: { provinceId: province.id, slug: slugify(cityName) } },
        update: {},
        create: { provinceId: province.id, nameFa: cityName, slug: slugify(cityName), isLandingEnabled: true }
      });
    }
  }
  const cities = await prisma.city.findMany();

  // 2. Users
  const userDelta = plans.find(p => p.model === 'User')?.delta || 0;
  console.log(`Seeding ${userDelta} Users...`);
  const password = await bcrypt.hash('Password@123', 10);
  for (let i = 0; i < userDelta; i++) {
    const username = `user_${mode.toLowerCase()}_${i}`;
    const userData = {
      username, email: `${username}@example.com`, password,
      firstName: namesFa.firstNames[i % namesFa.firstNames.length],
      lastName: namesFa.lastNames[i % namesFa.lastNames.length],
      phoneNumber: `+989${(200000000 + (mode === 'UI_SMALL' ? 1000 : mode === 'UI_MEDIUM' ? 5000 : 10000) + i).toString()}`,
      role: i < (userDelta * 0.1) ? UserRole.AUTHOR : i < (userDelta * 0.3) ? UserRole.SALON : UserRole.USER,
      isActive: true, isPhoneVerified: true, isStaff: i < (userDelta * 0.1),
      gender: i % 2 === 0 ? Gender.FEMALE : Gender.MALE,
      referralCode: `REF_${mode}_${i}`, cityId: cities[i % cities.length].id
    };
    UserSeedSchema.parse(userData);
    await prisma.user.upsert({ where: { username }, update: {}, create: userData });
  }
  const users = await prisma.user.findMany({ where: { role: UserRole.USER } });
  const owners = await prisma.user.findMany({ where: { role: UserRole.SALON } });
  const authors = await prisma.user.findMany({ where: { role: UserRole.AUTHOR } });

  // 3. Media
  console.log('Seeding Media assets...');
  const allMediaUrls = [...mediaAssets.salon, ...mediaAssets.artist, ...mediaAssets.blog];
  for (const url of allMediaUrls) {
    const storageKey = url.split('/').pop() || 'default';
    const exists = await prisma.media.findFirst({ where: { storageKey } });
    if (!exists) {
      await prisma.media.create({ data: { storageKey, url, type: 'image', mime: 'image/jpeg', status: MediaStatus.COMPLETED, sizeBytes: 2048, altText: 'Seeded asset' } });
    }
  }
  const allMedia = await prisma.media.findMany();

  // 4. Salons
  const salonDelta = plans.find(p => p.model === 'Salon')?.delta || 0;
  console.log(`Seeding ${salonDelta} Salons...`);
  for (let i = 0; i < salonDelta; i++) {
    const fullName = `${salonNames.prefixes[i % salonNames.prefixes.length]} ${salonNames.names[i % salonNames.names.length]} ${i}`;
    const slug = slugify(fullName);
    const salonData = {
      name: fullName, slug, cityId: cities[i % cities.length].id, status: AccountStatus.ACTIVE,
      priceTier: (i % 4) + 1, isWomenOnly: i % 5 !== 0,
      primaryOwnerId: owners[i % owners.length].id,
      verification: i % 10 === 0 ? VerificationStatus.NONE : VerificationStatus.VERIFIED
    };
    SalonSeedSchema.parse(salonData);
    await prisma.salon.upsert({
      where: { slug }, update: {},
      create: { ...salonData, avatarMediaId: allMedia[i % allMedia.length].id, coverMediaId: allMedia[(i + 1) % allMedia.length].id, avgRating: 0, reviewCount: 0 }
    });
  }
  const salons = await prisma.salon.findMany();

  // 5. Reviews (Skewed)
  const reviewDelta = plans.find(p => p.model === 'Review')?.delta || 0;
  console.log(`Seeding ${reviewDelta} Reviews...`);
  for (let i = 0; i < reviewDelta; i++) {
    // 10% of salons get 50% of reviews
    const targetSalon = i < (reviewDelta * 0.5) ? salons[i % 40] : salons[i % salons.length];
    const user = users[i % users.length];
    const reviewTemp = reviewsData[i % reviewsData.length];
    await prisma.review.create({
      data: {
        authorId: user.id, salonId: targetSalon.id, rating: reviewTemp.rating, body: reviewTemp.text,
        status: ReviewStatus.PUBLISHED, createdAt: new Date(Date.now() - (i * 100000))
      }
    });
    if (i % 2000 === 0 && i > 0) console.log(`Inserted ${i} reviews...`);
  }

  // Aggregation
  console.log('Finalizing aggregations...');
  for (const s of salons) {
    const agg = await prisma.review.aggregate({ where: { salonId: s.id }, _avg: { rating: true }, _count: { id: true } });
    await prisma.salon.update({ where: { id: s.id }, data: { avgRating: agg._avg.rating || 0, reviewCount: agg._count.id || 0 } });
  }

  console.log('Seeding process complete.');
}

main().catch(e => { console.error(e); process.exit(1); }).finally(async () => { await prisma.$disconnect(); });
