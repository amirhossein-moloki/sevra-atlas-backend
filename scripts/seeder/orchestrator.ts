import { PrismaClient, UserRole, AccountStatus, EntityType, PlanTier, ReviewStatus, MediaStatus, MediaKind, PostStatus, PostVisibility } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import * as fs from 'fs';
import * as path from 'path';
import { slugify, randomInt, pickOne, pickMany, skew } from './utils/common';
import { printReport, TargetPlan } from './report';
import { introspectApi, getDbCounts } from './utils/introspection';
import { deriveTargets } from './utils/deriver';
import { UserSeedSchema, SalonSeedSchema } from './utils/validation';

const prisma = new PrismaClient();

const datasetsPath = path.join(__dirname, 'datasets');
const namesFa = JSON.parse(fs.readFileSync(path.join(datasetsPath, 'names_fa.json'), 'utf-8')) as { firstNames: string[], lastNames: string[] };
const salonNames = JSON.parse(fs.readFileSync(path.join(datasetsPath, 'salon_names.json'), 'utf-8')) as { prefixes: string[], names: string[] };
const geoFa = JSON.parse(fs.readFileSync(path.join(datasetsPath, 'geo_fa.json'), 'utf-8')) as { province: string, cities: string[] }[];
const reviewsData = JSON.parse(fs.readFileSync(path.join(datasetsPath, 'reviews.json'), 'utf-8')) as { rating: number, text: string }[];
const mediaAssets = JSON.parse(fs.readFileSync(path.join(datasetsPath, 'media_assets.json'), 'utf-8')) as { salon: string[], artist: string[], blog: string[] };

async function main() {
  const isDryRun = process.argv.includes('--dry-run');
  const pagination = await introspectApi();
  const dbCounts = await getDbCounts(prisma);
  const derivedTargets = deriveTargets(pagination);

  const plans: TargetPlan[] = derivedTargets.map(t => ({
    model: t.model,
    current: (dbCounts as any)[t.model] || 0,
    required: t.required,
    delta: Math.max(0, t.required - ((dbCounts as any)[t.model] || 0)),
    justification: t.justification
  }));

  if (isDryRun) {
    printReport(plans);
    return;
  }

  console.log('Starting deterministic, idempotent seed process...');

  // 1. Geography
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
        create: { provinceId: province.id, nameFa: cityName, slug: slugify(cityName) }
      });
    }
  }

  const cities = await prisma.city.findMany();
  const password = await bcrypt.hash('Password@123', 10);
  const userDelta = plans.find(p => p.model === 'User')?.delta || 0;

  // 2. Users
  for (let i = 0; i < userDelta; i++) {
    const username = `user_v3_${i}`;
    const userData = {
      username, email: `${username}@example.com`, password,
      firstName: namesFa.firstNames[i % namesFa.firstNames.length],
      lastName: namesFa.lastNames[i % namesFa.lastNames.length],
      phoneNumber: `+989${(130000000 + i).toString()}`,
      role: i < 50 ? UserRole.AUTHOR : i < 150 ? UserRole.SALON : UserRole.USER,
      isActive: true, isPhoneVerified: true, isStaff: i < 50,
      referralCode: `REF_V3_${i}`, cityId: cities[i % cities.length].id
    };
    UserSeedSchema.parse(userData);
    await prisma.user.upsert({ where: { username }, update: {}, create: userData });
  }

  const users = await prisma.user.findMany({ where: { role: UserRole.USER } });
  const owners = await prisma.user.findMany({ where: { role: UserRole.SALON } });
  const authors = await prisma.user.findMany({ where: { role: UserRole.AUTHOR } });
  for (const author of authors) {
    await prisma.authorProfile.upsert({ where: { userId: author.id }, update: {}, create: { userId: author.id, displayName: `${author.firstName} ${author.lastName}`, bio: 'Expert Author' } });
  }
  const authorProfiles = await prisma.authorProfile.findMany();

  // 3. Media
  for (const url of [...mediaAssets.salon, ...mediaAssets.artist, ...mediaAssets.blog]) {
    const storageKey = url.split('/').pop() || 'default';
    const exists = await prisma.media.findFirst({ where: { storageKey } });
    if (!exists) {
      await prisma.media.create({ data: { storageKey, url, type: 'image', mime: 'image/jpeg', status: MediaStatus.COMPLETED, sizeBytes: 1024 } });
    }
  }
  const allMedia = await prisma.media.findMany();

  // 4. Salons
  const salonDelta = plans.find(p => p.model === 'Salon')?.delta || 0;
  for (let i = 0; i < salonDelta; i++) {
    const fullName = `${pickOne(salonNames.prefixes)} ${pickOne(salonNames.names)} ${i}`;
    const slug = slugify(fullName);
    const salonData = { name: fullName, slug, cityId: cities[i % cities.length].id, status: AccountStatus.ACTIVE, priceTier: (i % 4) + 1, isWomenOnly: i % 3 === 0, primaryOwnerId: owners[i % owners.length].id };
    SalonSeedSchema.parse(salonData);
    await prisma.salon.upsert({ where: { slug }, update: {}, create: { ...salonData, avatarMediaId: allMedia[i % allMedia.length].id, avgRating: 0, reviewCount: 0 } });
  }

  // 5. Artists
  const artistDelta = plans.find(p => p.model === 'Artist')?.delta || 0;
  for (let i = 0; i < artistDelta; i++) {
    const fullName = `${pickOne(namesFa.firstNames)} ${pickOne(namesFa.lastNames)} ${i}`;
    const slug = slugify(fullName);
    await prisma.artist.upsert({ where: { slug }, update: {}, create: { fullName, slug, cityId: cities[i % cities.length].id, status: AccountStatus.ACTIVE, primaryOwnerId: owners[i % owners.length].id, avatarMediaId: allMedia[i % allMedia.length].id } });
  }

  // 6. Posts
  const postDelta = plans.find(p => p.model === 'Post')?.delta || 0;
  for (let i = 0; i < postDelta; i++) {
    const title = `نکته زیبایی ${i}`;
    const slug = slugify(title) + '-' + i;
    await prisma.post.upsert({ where: { slug }, update: {}, create: { title, slug, excerpt: 'excerpt', content: 'content', authorId: authorProfiles[i % authorProfiles.length].userId, status: PostStatus.published, visibility: PostVisibility.public, publishedAt: new Date(), coverMediaId: allMedia[i % allMedia.length].id } });
  }

  // 7. Reviews
  const reviewDelta = plans.find(p => p.model === 'Review')?.delta || 0;
  const salons = await prisma.salon.findMany();
  const artists = await prisma.artist.findMany();
  for (let i = 0; i < reviewDelta; i++) {
     const isSalon = i % 2 === 0;
     await prisma.review.create({ data: { authorId: users[i % users.length].id, salonId: isSalon ? salons[i % salons.length].id : null, artistId: !isSalon ? artists[i % artists.length].id : null, rating: reviewsData[i % reviewsData.length].rating, body: reviewsData[i % reviewsData.length].text, status: ReviewStatus.PUBLISHED } });
  }

  // Aggregation fixup
  console.log('Aggregation fixup...');
  for (const s of salons) {
    const agg = await prisma.review.aggregate({ where: { salonId: s.id }, _avg: { rating: true }, _count: { id: true } });
    await prisma.salon.update({ where: { id: s.id }, data: { avgRating: agg._avg.rating || 0, reviewCount: agg._count.id || 0 } });
  }

  console.log('Seeding complete!');
}

main().catch(e => { console.error(e); process.exit(1); }).finally(async () => { await prisma.$disconnect(); });
