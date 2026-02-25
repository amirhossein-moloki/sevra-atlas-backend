import { PrismaClient, UserRole, AccountStatus, EntityType, PlanTier, ReviewStatus, MediaStatus, MediaKind, PostStatus, PostVisibility, Gender, VerificationStatus } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import * as fs from 'fs';
import * as path from 'path';
import { config } from '../../src/config';
import { slugify, randomInt, pickOne, pickMany, skew } from './utils/common';
import { downloadImage } from './utils/download';
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

const userImageUrls = [
  'https://images.pexels.com/photos/4677845/pexels-photo-4677845.jpeg',
  'https://images.pexels.com/photos/887352/pexels-photo-887352.jpeg',
  'https://images.pexels.com/photos/939836/pexels-photo-939836.jpeg',
  'https://images.pexels.com/photos/939835/pexels-photo-939835.jpeg',
  'https://images.pexels.com/photos/973405/pexels-photo-973405.jpeg'
];

const salonImageUrls = [
  'https://cdn.pixabay.com/photo/2019/03/08/20/17/beauty-salon-4043096_1280.jpg',
  'https://cdn.pixabay.com/photo/2019/09/16/17/18/spa-4481538_1280.jpg',
  'https://cdn.pixabay.com/photo/2018/02/22/17/09/barber-shop-3173422_1280.jpg',
  'https://cdn.pixabay.com/photo/2015/11/27/02/24/solarium-1064815_1280.jpg',
  'https://cdn.pixabay.com/photo/2022/04/11/18/18/manicure-7126386_1280.png',
  'https://cdn.pixabay.com/photo/2017/08/24/11/12/makeup-2676392_1280.jpg',
  'https://cdn.pixabay.com/photo/2020/05/24/02/00/barber-shop-5212059_1280.jpg',
  'https://cdn.pixabay.com/photo/2016/01/22/01/17/salon-1155094_1280.jpg',
  'https://cdn.pixabay.com/photo/2016/07/17/10/31/living-room-1523480_1280.jpg',
  'https://cdn.pixabay.com/photo/2017/07/25/10/37/woman-2537564_1280.jpg',
  'https://images.pexels.com/photos/853427/pexels-photo-853427.jpeg',
  'https://images.pexels.com/photos/696285/pexels-photo-696285.jpeg',
  'https://images.pexels.com/photos/3993308/pexels-photo-3993308.jpeg',
  'https://images.pexels.com/photos/973403/pexels-photo-973403.jpeg',
  'https://images.pexels.com/photos/3993312/pexels-photo-3993312.jpeg'
];

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

  // 2. Media (Moved up to provide templates for Users/Salons)
  console.log('Seeding Media assets...');
  const getMime = (url: string) => url.toLowerCase().endsWith('.png') ? 'image/png' : 'image/jpeg';

  const allMediaUrls = [...mediaAssets.salon, ...mediaAssets.artist, ...mediaAssets.blog];
  for (const url of allMediaUrls) {
    try {
      const { storageKey } = await downloadImage(url, 'seeded/legacy');
      const exists = await prisma.media.findFirst({ where: { storageKey } });
      if (!exists) {
        await prisma.media.create({
          data: {
            storageKey,
            url: `/${config.storage.uploadDir}/${storageKey}`,
            type: 'image',
            mime: getMime(url),
            status: MediaStatus.COMPLETED,
            sizeBytes: 2048,
            altText: 'Seeded asset'
          }
        });
      }
    } catch (err) {
      console.warn(`Failed to download legacy asset ${url}:`, err);
    }
  }

  const userMediaTemplates: { url: string, storageKey: string }[] = [];
  for (const url of userImageUrls) {
    try {
      const { storageKey } = await downloadImage(url, 'seeded/users');
      userMediaTemplates.push({
        url: `/${config.storage.uploadDir}/${storageKey}`,
        storageKey
      });
    } catch (err) {
      console.warn(`Failed to download user asset ${url}:`, err);
    }
  }

  const salonMediaTemplates: { url: string, storageKey: string }[] = [];
  for (const url of salonImageUrls) {
    try {
      const { storageKey } = await downloadImage(url, 'seeded/salons');
      salonMediaTemplates.push({
        url: `/${config.storage.uploadDir}/${storageKey}`,
        storageKey
      });
    } catch (err) {
      console.warn(`Failed to download salon asset ${url}:`, err);
    }
  }

  const allMedia = await prisma.media.findMany();

  // 3. Users
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
    const user = await prisma.user.upsert({ where: { username }, update: {}, create: userData });

    // Assign 5 nail sample images to each user
    const existingMediaCount = await prisma.media.count({ where: { uploadedBy: user.id, kind: MediaKind.GALLERY } });
    if (existingMediaCount < 5) {
      for (const template of userMediaTemplates) {
        await prisma.media.create({
          data: {
            storageKey: template.storageKey,
            url: template.url,
            type: 'image',
            mime: getMime(template.url),
            status: MediaStatus.COMPLETED,
            sizeBytes: 2048,
            altText: 'نمونه کار ناخن',
            uploadedBy: user.id,
            kind: MediaKind.GALLERY
          }
        });
      }
    }
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

    // Assign 5 random salon images to each salon
    const existingSalonMediaCount = await prisma.media.count({
      where: { entityType: EntityType.SALON, entityId: salon.id, kind: MediaKind.GALLERY }
    });
    if (existingSalonMediaCount < 5) {
      const selectedTemplates = pickMany(salonMediaTemplates, 5);
      for (const template of selectedTemplates) {
        await prisma.media.create({
          data: {
            storageKey: template.storageKey,
            url: template.url,
            type: 'image',
            mime: getMime(template.url),
            status: MediaStatus.COMPLETED,
            sizeBytes: 2048,
            altText: 'فضای سالن زیبایی',
            entityType: EntityType.SALON,
            entityId: salon.id,
            kind: MediaKind.GALLERY
          }
        });
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

    await prisma.artist.upsert({
      where: { slug }, update: {},
      create: {
        fullName: fullNameFa, slug, cityId: cities[i % cities.length].id,
        status: AccountStatus.ACTIVE, primaryOwnerId: owners[i % owners.length].id,
        avatarMediaId: allMedia[i % allMedia.length].id,
        summary: `Professional artist: ${fullNameFa}`,
        avgRating: 0, reviewCount: 0
      }
    });
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
