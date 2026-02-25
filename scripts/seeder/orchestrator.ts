import { PrismaClient, UserRole, AccountStatus, EntityType, PlanTier, ReviewStatus, MediaStatus, MediaKind, PostStatus, PostVisibility, Gender, VerificationStatus } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import * as fs from 'fs';
import * as path from 'path';
import { config } from '../../src/config';
import { slugify, randomInt, pickOne, pickMany, skew } from './utils/common';
import { syncLocalImages } from './utils/local-media';
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

  // 2. Media (Using local images)
  console.log('Synchronizing local media assets...');
  const localTemplates = await syncLocalImages();

  for (const template of localTemplates) {
    const exists = await prisma.media.findFirst({ where: { storageKey: template.storageKey } });
    if (!exists) {
      await prisma.media.create({
        data: {
          storageKey: template.storageKey,
          url: template.url,
          type: 'image',
          mime: template.mime,
          status: MediaStatus.COMPLETED,
          sizeBytes: 2048,
          altText: 'Seeded asset'
        }
      });
    }
  }

  const allMedia = await prisma.media.findMany();

  if (allMedia.length === 0) {
    console.warn('⚠️ No media assets available for seeding. Avatars and galleries will be empty.');
  }

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

    // Assign 5 nail sample images to each user from local pool
    const existingMediaCount = await prisma.media.count({ where: { uploadedBy: user.id, kind: MediaKind.GALLERY } });
    if (existingMediaCount < 5 && localTemplates.length > 0) {
      const selectedTemplates = pickMany(localTemplates, Math.min(5, localTemplates.length));
      for (const template of selectedTemplates) {
        await prisma.media.create({
          data: {
            storageKey: template.storageKey,
            url: template.url,
            type: 'image',
            mime: template.mime,
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
        avatarMediaId: allMedia.length > 0 ? allMedia[i % allMedia.length].id : null,
        coverMediaId: allMedia.length > 0 ? allMedia[(i + 1) % allMedia.length].id : null,
        avgRating: 0,
        reviewCount: 0
      }
    });

    // Assign 5 random salon images to each salon from local pool
    const existingSalonMediaCount = await prisma.media.count({
      where: { entityType: EntityType.SALON, entityId: salon.id, kind: MediaKind.GALLERY }
    });
    if (existingSalonMediaCount < 5 && localTemplates.length > 0) {
      const selectedTemplates = pickMany(localTemplates, Math.min(5, localTemplates.length));
      for (const template of selectedTemplates) {
        await prisma.media.create({
          data: {
            storageKey: template.storageKey,
            url: template.url,
            type: 'image',
            mime: template.mime,
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
        avatarMediaId: allMedia.length > 0 ? allMedia[i % allMedia.length].id : null,
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
        publishedAt: new Date(), coverMediaId: allMedia.length > 0 ? allMedia[i % allMedia.length].id : null
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
