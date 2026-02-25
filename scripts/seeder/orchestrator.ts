import 'dotenv/config';
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

const datasetsPath = path.join(__dirname, 'datasets');
const namesFa = JSON.parse(fs.readFileSync(path.join(datasetsPath, 'names_fa.json'), 'utf-8')) as { firstNames: string[], lastNames: string[] };
const salonNames = JSON.parse(fs.readFileSync(path.join(datasetsPath, 'salon_names.json'), 'utf-8')) as { prefixes: string[], names: string[] };
const geoFa = JSON.parse(fs.readFileSync(path.join(datasetsPath, 'geo_fa.json'), 'utf-8')) as { province: string, cities: string[] }[];
const reviewsData = JSON.parse(fs.readFileSync(path.join(datasetsPath, 'reviews.json'), 'utf-8')) as { rating: number, text: string }[];
const mediaAssets = JSON.parse(fs.readFileSync(path.join(datasetsPath, 'media_assets.json'), 'utf-8')) as { salon: string[], artist: string[], blog: string[] };

interface BeautyAsset {
  title: string;
  url: string;
  alt: string;
  localPath?: string;
}

interface BeautyAssets {
  nail: BeautyAsset[];
  salon: BeautyAsset[];
}

const beautyAssetsPath = path.join(__dirname, '..', '..', 'scripts', 'beauty_assets_v2.json');
let beautyAssets: BeautyAssets = { nail: [], salon: [] };
if (fs.existsSync(beautyAssetsPath)) {
  beautyAssets = JSON.parse(fs.readFileSync(beautyAssetsPath, 'utf-8'));
}

const getMimeType = (url: string) => {
  const ext = url.split('.').pop()?.toLowerCase();
  if (ext === 'png') return 'image/png';
  if (ext === 'webp') return 'image/webp';
  return 'image/jpeg';
};

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
  const cityTarget = plans.find(p => p.model === 'City')?.required || 10;
  console.log(`Seeding Geography (Target Cities: ${cityTarget})...`);
  let seededCityCount = 0;
  for (const provData of geoFa) {
    if (seededCityCount >= cityTarget) break;
    const province = await prisma.province.upsert({
      where: { slug: slugify(provData.province) + '-province' },
      update: {},
      create: { nameFa: provData.province, slug: slugify(provData.province) + '-province' }
    });
    for (const cityName of provData.cities) {
      if (seededCityCount >= cityTarget) break;
      await prisma.city.upsert({
        where: { provinceId_slug: { provinceId: province.id, slug: slugify(cityName) } },
        update: {},
        create: { provinceId: province.id, nameFa: cityName, slug: slugify(cityName), isLandingEnabled: true }
      });
      seededCityCount++;
    }
  }
  const cities = await prisma.city.findMany();

  // 2. Users
  const userDelta = plans.find(p => p.model === 'User')?.delta || 0;
  console.log(`Seeding ${userDelta} Users...`);
  const password = await bcrypt.hash('Password@123', 10);
  for (let i = 0; i < userDelta; i++) {
    const username = `user_${mode.toLowerCase()}_${i}`;
    const fName = namesFa.firstNames[i % namesFa.firstNames.length];
    const lName = namesFa.lastNames[i % namesFa.lastNames.length];
    const userData = {
      username, email: `${username}@example.com`, password,
      firstName: fName, lastName: lName,
      phoneNumber: `+989${(300000000 + (mode === 'UI_SMALL' ? 1000 : 5000) + i).toString()}`,
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

  for (const author of authors) {
    await prisma.authorProfile.upsert({
      where: { userId: author.id },
      update: {},
      create: { userId: author.id, displayName: `${author.firstName} ${author.lastName}`, bio: 'Expert Author' }
    });
  }
  const authorProfiles = await prisma.authorProfile.findMany();

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
    const prefixFa = salonNames.prefixes[i % salonNames.prefixes.length];
    const nameFa = salonNames.names[i % salonNames.names.length];
    const fullNameFa = `${prefixFa} ${nameFa} ${i}`;

    // Search enhancement: include Latin transliteration in description or summary
    const slug = slugify(fullNameFa);
    const latinName = slug.replace(/-/g, ' ');

    const salonData = {
      name: fullNameFa, slug, cityId: cities[i % cities.length].id, status: AccountStatus.ACTIVE,
      priceTier: (i % 4) + 1, isWomenOnly: i % 5 !== 0,
      primaryOwnerId: owners[i % owners.length].id,
      verification: i % 10 === 0 ? VerificationStatus.NONE : VerificationStatus.VERIFIED
    };
    SalonSeedSchema.parse(salonData);
    const salon = await prisma.salon.upsert({
      where: { slug }, update: {},
      create: {
        ...salonData,
        summary: `Best services in ${cities[i % cities.length].nameFa} (${latinName})`,
        avatarMediaId: allMedia[i % allMedia.length].id,
        coverMediaId: allMedia[(i + 1) % allMedia.length].id,
        avgRating: 0,
        reviewCount: 0
      }
    });

    // Add 5 random salon gallery images
    if (beautyAssets.salon.length > 0) {
      const existingGallery = await prisma.media.count({
        where: { entityType: EntityType.SALON, entityId: salon.id, kind: MediaKind.GALLERY }
      });

      if (existingGallery === 0) {
        const selectedSalonImages = pickMany(beautyAssets.salon, 5);
        for (const img of selectedSalonImages) {
          const url = img.localPath || img.url;
          const fileName = url.split('/').pop() || 'image.jpg';
          await prisma.media.create({
            data: {
              storageKey: `salon_${salon.id}_${fileName}`,
              url: url,
              type: 'image',
              mime: getMimeType(url),
              status: MediaStatus.COMPLETED,
              kind: MediaKind.GALLERY,
              entityType: EntityType.SALON,
              entityId: salon.id,
              altText: img.alt,
              title: img.title
            }
          });
        }
      }
    }
  }
  const salons = await prisma.salon.findMany();

  // 5. Artists
  const artistDelta = plans.find(p => p.model === 'Artist')?.delta || 0;
  console.log(`Seeding ${artistDelta} Artists...`);
  for (let i = 0; i < artistDelta; i++) {
    const fNameFa = namesFa.firstNames[i % namesFa.firstNames.length];
    const lNameFa = namesFa.lastNames[i % namesFa.lastNames.length];
    const fullNameFa = `${fNameFa} ${lNameFa} ${i}`;
    const slug = slugify(fullNameFa);

    const artist = await prisma.artist.upsert({
      where: { slug }, update: {},
      create: {
        fullName: fullNameFa, slug, cityId: cities[i % cities.length].id,
        status: AccountStatus.ACTIVE, primaryOwnerId: owners[i % owners.length].id,
        avatarMediaId: allMedia[i % allMedia.length].id,
        summary: `Professional artist: ${fullNameFa}`,
        avgRating: 0, reviewCount: 0
      }
    });

    // Add all 5 nail gallery images for every artist (as requested for "users")
    if (beautyAssets.nail.length > 0) {
      const existingGallery = await prisma.media.count({
        where: { entityType: EntityType.ARTIST, entityId: artist.id, kind: MediaKind.GALLERY }
      });

      if (existingGallery === 0) {
        for (const img of beautyAssets.nail) {
          const url = img.localPath || img.url;
          const fileName = url.split('/').pop() || 'image.jpg';
          await prisma.media.create({
            data: {
              storageKey: `artist_${artist.id}_${fileName}`,
              url: url,
              type: 'image',
              mime: getMimeType(url),
              status: MediaStatus.COMPLETED,
              kind: MediaKind.GALLERY,
              entityType: EntityType.ARTIST,
              entityId: artist.id,
              altText: img.alt,
              title: img.title
            }
          });
        }
      }
    }
  }
  const artists = await prisma.artist.findMany();

  // 6. Posts
  const postDelta = plans.find(p => p.model === 'Post')?.delta || 0;
  console.log(`Seeding ${postDelta} Posts...`);
  for (let i = 0; i < postDelta; i++) {
    const title = `نکته زیبایی ${i}`;
    const slug = slugify(title) + '-' + i;
    await prisma.post.upsert({
      where: { slug }, update: {},
      create: {
        title, slug, excerpt: 'Beauty tips and tricks.', content: 'Full content of the article.',
        authorId: authorProfiles[i % authorProfiles.length].userId,
        status: PostStatus.published, visibility: PostVisibility.public,
        publishedAt: new Date(), coverMediaId: allMedia[i % allMedia.length].id
      }
    });
  }

  // 7. Reviews (Skewed)
  const reviewDelta = plans.find(p => p.model === 'Review')?.delta || 0;
  console.log(`Seeding ${reviewDelta} Reviews...`);
  for (let i = 0; i < reviewDelta; i++) {
    const isSalon = i % 2 === 0;
    const target = isSalon
      ? (i < (reviewDelta * 0.4) ? salons[i % 20] : salons[i % salons.length])
      : (i < (reviewDelta * 0.4) ? artists[i % 20] : artists[i % artists.length]);

    const user = users[i % users.length];
    const reviewTemp = reviewsData[i % reviewsData.length];
    await prisma.review.create({
      data: {
        authorId: user.id,
        salonId: isSalon ? target.id : null,
        artistId: !isSalon ? target.id : null,
        rating: reviewTemp.rating, body: reviewTemp.text,
        status: ReviewStatus.PUBLISHED, createdAt: new Date(Date.now() - (i * 100000))
      }
    });
    if (i % 5000 === 0 && i > 0) console.log(`Inserted ${i} reviews...`);
  }

  console.log('Finalizing aggregations...');
  for (const s of salons) {
    const agg = await prisma.review.aggregate({ where: { salonId: s.id }, _avg: { rating: true }, _count: { id: true } });
    await prisma.salon.update({ where: { id: s.id }, data: { avgRating: agg._avg.rating || 0, reviewCount: agg._count.id || 0 } });
  }
  for (const a of artists) {
    const agg = await prisma.review.aggregate({ where: { artistId: a.id }, _avg: { rating: true }, _count: { id: true } });
    await prisma.artist.update({ where: { id: a.id }, data: { avgRating: agg._avg.rating || 0, reviewCount: agg._count.id || 0 } });
  }

  console.log('Seeding process complete.');
}

main().catch(e => { console.error(e); process.exit(1); }).finally(async () => { await prisma.$disconnect(); });
