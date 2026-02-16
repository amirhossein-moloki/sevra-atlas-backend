import {
  PrismaClient,
  UserRole,
  AccountStatus,
  PostStatus,
  PostVisibility,
  CommentStatus,
  EntityType,
  MediaKind,
  MediaStatus,
  Gender,
  VerificationStatus,
  CanonicalMode,
  RobotsIndex,
  SitemapChangeFreq,
  OrderStrategy,
  RedirectType,
  FollowTargetType,
  SaveTargetType,
} from '@prisma/client';
import { fakerFA as faker } from '@faker-js/faker';
import { faker as fakerEn } from '@faker-js/faker';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

// --- Configuration ---
const SEED_MODE = process.env.SEED_MODE || 'demo'; // minimal | demo | heavy
const SEED_VOLUME = process.env.SEED_VOLUME || 'medium'; // small | medium | large
const SEED_DRY_RUN = process.env.SEED_DRY_RUN === 'true';
const SEED_RESET = process.env.SEED_RESET === 'true';

const SEED_USERS = process.env.SEED_USERS !== 'false';
const SEED_ADMIN = process.env.SEED_ADMIN !== 'false';
const SEED_CONTENT = process.env.SEED_CONTENT !== 'false';
const SEED_MEDIA = process.env.SEED_MEDIA !== 'false';
const SEED_GEO = process.env.SEED_GEO !== 'false';
const SEED_DIRECTORY = process.env.SEED_DIRECTORY !== 'false';

const ADMIN_EMAIL = process.env.SEED_ADMIN_EMAIL || 'admin@sevra.ir';
const ADMIN_PASSWORD = process.env.SEED_ADMIN_PASSWORD || 'Admin@123456';

const VOLUMES = {
  small: { users: 50, authors: 5, categories: 10, tags: 30, posts: 50, comments: 200, salons: 10, artists: 15, reviews: 50 },
  medium: { users: 300, authors: 20, categories: 30, tags: 100, posts: 500, comments: 2000, salons: 50, artists: 80, reviews: 500 },
  large: { users: 2000, authors: 50, categories: 50, tags: 200, posts: 3000, comments: 15000, salons: 300, artists: 500, reviews: 5000 },
};

const v = VOLUMES[SEED_VOLUME as keyof typeof VOLUMES] || VOLUMES.medium;

// --- Helpers ---
const log = (msg: string) => console.log(`[SEED] ${msg}`);
const logStep = (step: string) => console.log(`\n--- [${step}] ---`);

async function hashPassword(password: string) {
  return bcrypt.hash(password, 10);
}

function getRandomItem<T>(array: T[]): T {
  return array[Math.floor(Math.random() * array.length)];
}

function getRandomItems<T>(array: T[], count: number): T[] {
  const shuffled = [...array].sort(() => 0.5 - Math.random());
  return shuffled.slice(0, count);
}

const BATCH_SIZE = 100;

// --- Seeding Functions ---

async function seedGeography() {
  logStep('Seeding Geography');

  const provinces = [
    { nameFa: 'تهران', nameEn: 'Tehran', slug: 'tehran' },
    { nameFa: 'اصفهان', nameEn: 'Isfahan', slug: 'isfahan' },
    { nameFa: 'فارس', nameEn: 'Fars', slug: 'fars' },
    { nameFa: 'خراسان رضوی', nameEn: 'Razavi Khorasan', slug: 'razavi-khorasan' },
    { nameFa: 'البرز', nameEn: 'Alborz', slug: 'alborz' },
    { nameFa: 'آذربایجان شرقی', nameEn: 'East Azerbaijan', slug: 'east-azerbaijan' },
    { nameFa: 'مازندران', nameEn: 'Mazandaran', slug: 'mazandaran' },
    { nameFa: 'گیلان', nameEn: 'Gilan', slug: 'gilan' },
  ];

  const provinceIds: bigint[] = [];
  for (const p of provinces) {
    const province = await prisma.province.upsert({
      where: { slug: p.slug },
      update: {},
      create: p,
    });
    provinceIds.push(province.id);
  }
  log(`Upserted ${provinces.length} provinces`);

  const cities = [
    { provinceSlug: 'tehran', nameFa: 'تهران', nameEn: 'Tehran', slug: 'tehran', lat: 35.6892, lng: 51.3890 },
    { provinceSlug: 'tehran', nameFa: 'اسلامشهر', nameEn: 'Islamshahr', slug: 'islamshahr', lat: 35.5614, lng: 51.2331 },
    { provinceSlug: 'isfahan', nameFa: 'اصفهان', nameEn: 'Isfahan', slug: 'isfahan', lat: 32.6546, lng: 51.6680 },
    { provinceSlug: 'fars', nameFa: 'شیراز', nameEn: 'Shiraz', slug: 'shiraz', lat: 29.5918, lng: 52.5837 },
    { provinceSlug: 'razavi-khorasan', nameFa: 'مشهد', nameEn: 'Mashhad', slug: 'mashhad', lat: 36.2972, lng: 59.6067 },
    { provinceSlug: 'alborz', nameFa: 'کرج', nameEn: 'Karaj', slug: 'karaj', lat: 35.8327, lng: 50.9915 },
    { provinceSlug: 'east-azerbaijan', nameFa: 'تبریز', nameEn: 'Tabriz', slug: 'tabriz', lat: 38.0962, lng: 46.2731 },
  ];

  const cityIds: bigint[] = [];
  for (const c of cities) {
    const province = await prisma.province.findUnique({ where: { slug: c.provinceSlug } });
    if (!province) continue;

    const city = await prisma.city.upsert({
      where: { provinceId_slug: { provinceId: province.id, slug: c.slug } },
      update: {},
      create: {
        provinceId: province.id,
        nameFa: c.nameFa,
        nameEn: c.nameEn,
        slug: c.slug,
        lat: c.lat,
        lng: c.lng,
      },
    });
    cityIds.push(city.id);
  }
  log(`Upserted ${cityIds.length} cities`);

  const neighborhoods = [
    { citySlug: 'tehran', nameFa: 'سعادت‌آباد', slug: 'saadat-abad' },
    { citySlug: 'tehran', nameFa: 'زعفرانیه', slug: 'zaferanieh' },
    { citySlug: 'tehran', nameFa: 'پونک', slug: 'poonak' },
    { citySlug: 'tehran', nameFa: 'تهرانپارس', slug: 'tehranpars' },
    { citySlug: 'tehran', nameFa: 'نیاوران', slug: 'niavaran' },
    { citySlug: 'tehran', nameFa: 'تجریش', slug: 'tajrish' },
  ];

  for (const n of neighborhoods) {
    const city = await prisma.city.findFirst({ where: { slug: n.citySlug } });
    if (!city) continue;
    await prisma.neighborhood.upsert({
      where: { cityId_slug: { cityId: city.id, slug: n.slug } },
      update: {},
      create: {
        cityId: city.id,
        nameFa: n.nameFa,
        slug: n.slug,
      },
    });
  }
  log(`Upserted ${neighborhoods.length} neighborhoods`);

  return { provinceIds, cityIds };
}

async function seedUsers(cityIds: bigint[]) {
  logStep('Seeding Users');
  const passwordHash = await hashPassword(ADMIN_PASSWORD);

  // 1. Admin
  const admin = await prisma.user.upsert({
    where: { username: 'admin' },
    update: { password: passwordHash },
    create: {
      username: 'admin',
      firstName: 'مدیر',
      lastName: 'کل',
      email: ADMIN_EMAIL,
      phoneNumber: '+989000000000',
      isStaff: true,
      isActive: true,
      isPhoneVerified: true,
      role: UserRole.ADMIN,
      referralCode: 'ADMIN_SEVRA',
      password: passwordHash,
    },
  });
  log(`Admin created/updated: ${ADMIN_EMAIL}`);

  // 2. Authors/Staff
  const authors: any[] = [];
  for (let i = 1; i <= v.authors; i++) {
    const username = `author_${i}`;
    const user = await prisma.user.upsert({
      where: { username },
      update: {},
      create: {
        username,
        firstName: faker.person.firstName(),
        lastName: faker.person.lastName(),
        email: `author${i}@sevra.ir`,
        phoneNumber: `+98912${String(i).padStart(8, '0')}`,
        isStaff: true,
        isActive: true,
        isPhoneVerified: true,
        role: UserRole.AUTHOR,
        referralCode: `AUTH${i}`,
        password: passwordHash,
        cityId: getRandomItem(cityIds),
      },
    });

    const profile = await prisma.authorProfile.upsert({
      where: { userId: user.id },
      update: {},
      create: {
        userId: user.id,
        displayName: `${user.firstName} ${user.lastName}`,
        bio: faker.lorem.paragraph(),
      }
    });
    authors.push({ user, profile });
  }
  log(`Upserted ${authors.length} authors`);

  // 3. Regular Users
  const regularUserIds: bigint[] = [];
  const existingUsersCount = await prisma.user.count({ where: { role: UserRole.USER } });
  const usersToCreate = Math.max(0, v.users - existingUsersCount);

  if (usersToCreate > 0) {
    log(`Creating ${usersToCreate} regular users in batches...`);
    for (let i = 0; i < usersToCreate; i += BATCH_SIZE) {
      const batch = Array.from({ length: Math.min(BATCH_SIZE, usersToCreate - i) }).map(() => {
        const first = faker.person.firstName();
        const last = faker.person.lastName();
        const uname = fakerEn.internet.username({ firstName: first, lastName: last }) + faker.number.int({ min: 100, max: 999999 });
        return {
          username: uname.substring(0, 150),
          firstName: first,
          lastName: last,
          email: fakerEn.internet.email({ firstName: first, lastName: last }),
          phoneNumber: `+989${faker.string.numeric(9)}`,
          isStaff: false,
          isActive: true,
          isPhoneVerified: faker.datatype.boolean(0.8),
          role: UserRole.USER,
          referralCode: fakerEn.string.alphanumeric(10).toUpperCase(),
          password: passwordHash,
          cityId: getRandomItem(cityIds),
          gender: getRandomItem([Gender.FEMALE, Gender.MALE, Gender.UNSPECIFIED]),
        };
      });

      await prisma.user.createMany({ data: batch, skipDuplicates: true });
    }
  }

  const allRegularUsers = await prisma.user.findMany({ where: { role: UserRole.USER }, select: { id: true } });
  log(`Total regular users: ${allRegularUsers.length}`);

  return { admin, authors, regularUserIds: allRegularUsers.map(u => u.id) };
}

async function seedTaxonomy() {
  logStep('Seeding Taxonomy');

  // Blog Categories
  const categories = [];
  for (let i = 0; i < v.categories; i++) {
    const name = faker.commerce.department() + ' ' + i;
    const slug = fakerEn.helpers.slugify(name).toLowerCase().substring(0, 50);
    const cat = await prisma.category.upsert({
      where: { slug },
      update: {},
      create: {
        name,
        slug,
        description: faker.lorem.sentence(),
        order: i,
      }
    });
    categories.push(cat);
  }
  log(`Upserted ${categories.length} blog categories`);

  // Blog Tags
  const tags = [];
  for (let i = 0; i < v.tags; i++) {
    const name = faker.commerce.productAdjective() + i;
    const slug = fakerEn.helpers.slugify(name).toLowerCase().substring(0, 50);
    const tag = await prisma.tag.upsert({
      where: { slug },
      update: {},
      create: {
        name,
        slug,
        description: faker.lorem.sentence(),
      }
    });
    tags.push(tag);
  }
  log(`Upserted ${tags.length} blog tags`);

  // Service Categories & Definitions
  const serviceCats = [
    { nameFa: 'خدمات مو', slug: 'hair', services: ['کوتاهی', 'رنگ و لایت', 'کراتین', 'بافت', 'شینیون'] },
    { nameFa: 'خدمات ناخن', slug: 'nail', services: ['کاشت ناخن', 'مانیکور', 'پدیکور', 'ژلیش'] },
    { nameFa: 'میکاپ و گریم', slug: 'makeup', services: ['میکاپ عروس', 'میکاپ روزانه', 'گریم تخصصی'] },
    { nameFa: 'خدمات پوست', slug: 'skin', services: ['فیشیال', 'پاکسازی', 'مزوتراپی'] },
    { nameFa: 'مژه و ابرو', slug: 'eye', services: ['کاشت مژه', 'لیفت ابرو', 'میکروبلیدینگ'] },
  ];

  const serviceDefinitionIds: bigint[] = [];
  for (const sc of serviceCats) {
    const category = await prisma.serviceCategory.upsert({
      where: { slug: sc.slug },
      update: {},
      create: { nameFa: sc.nameFa, slug: sc.slug }
    });

    for (const sName of sc.services) {
      const sSlug = fakerEn.helpers.slugify(sName + '-' + sc.slug).toLowerCase();
      const sDef = await prisma.serviceDefinition.upsert({
        where: { slug: sSlug },
        update: {},
        create: {
          nameFa: sName,
          slug: sSlug,
          categoryId: category.id,
          description: faker.lorem.sentence(),
        }
      });
      serviceDefinitionIds.push(sDef.id);
    }
  }
  log(`Upserted ${serviceCats.length} service categories and their definitions`);

  // Specialties
  const specialties = [
    { nameFa: 'رنگ‌کار حرفه‌ای', slug: 'colorist' },
    { nameFa: 'ناخن‌کار', slug: 'nail-artist' },
    { nameFa: 'میکاپ آرتیست', slug: 'makeup-artist' },
    { nameFa: 'پیگمنتر', slug: 'pigmenter' },
    { nameFa: 'هیر استایلیست', slug: 'hair-stylist' },
  ];
  const specialtyIds: bigint[] = [];
  for (const s of specialties) {
    const spec = await prisma.specialty.upsert({
      where: { slug: s.slug },
      update: {},
      create: s,
    });
    specialtyIds.push(spec.id);
  }
  log(`Upserted ${specialties.length} specialties`);

  return { categories, tags, serviceDefinitionIds, specialtyIds };
}

async function seedMedia(adminId: bigint) {
  logStep('Seeding Media Placeholder Records');
  // We'll just create a pool of media records to be used by others
  const mediaIds: bigint[] = [];
  const mediaCount = 100;

  for (let i = 0; i < mediaCount; i++) {
    const m = await prisma.media.create({
      data: {
        storageKey: `seed/image-${i}.jpg`,
        url: `https://picsum.photos/seed/${i}/800/600`,
        type: 'image',
        mime: 'image/jpeg',
        width: 800,
        height: 600,
        sizeBytes: 50000,
        altText: faker.lorem.sentence(),
        title: faker.lorem.words(3),
        status: MediaStatus.COMPLETED,
        uploadedBy: adminId,
      }
    });
    mediaIds.push(m.id);
  }
  log(`Created ${mediaIds.length} media records`);
  return mediaIds;
}

async function seedBlog(authors: any[], categories: any[], tags: any[], mediaIds: bigint[]) {
  logStep('Seeding Blog Posts & Comments');

  const existingPostsCount = await prisma.post.count();
  const postsToCreate = Math.max(0, v.posts - existingPostsCount);

  if (postsToCreate > 0) {
    log(`Creating ${postsToCreate} posts in batches...`);
    for (let i = 0; i < postsToCreate; i += BATCH_SIZE) {
      const batchCount = Math.min(BATCH_SIZE, postsToCreate - i);
      for (let j = 0; j < batchCount; j++) {
        const title = faker.lorem.sentence();
        const slug = fakerEn.helpers.slugify(title).toLowerCase().substring(0, 40) + '-' + faker.string.alphanumeric(5);
        const author = getRandomItem(authors);

        const post = await prisma.post.create({
          data: {
            title,
            slug,
            excerpt: faker.lorem.paragraph(),
            content: faker.lorem.paragraphs(5),
            status: getRandomItem([PostStatus.published, PostStatus.draft, PostStatus.archived]),
            visibility: PostVisibility.public,
            publishedAt: faker.date.past({ years: 1 }),
            authorId: author.user.id,
            categoryId: getRandomItem(categories).id,
            coverMediaId: getRandomItem(mediaIds),
            readingTimeSec: faker.number.int({ min: 60, max: 600 }),
            viewsCount: faker.number.int({ min: 0, max: 10000 }),
          }
        });

        // Add random tags
        const selectedTags = getRandomItems(tags, faker.number.int({ min: 1, max: 5 }));
        await prisma.postTag.createMany({
          data: selectedTags.map(t => ({ postId: post.id, tagId: t.id })),
          skipDuplicates: true,
        });

        // Add SEO Meta
        await prisma.seoMeta.create({
          data: {
            entityType: EntityType.BLOG_POST,
            entityId: post.id,
            title: post.title.substring(0, 60),
            description: post.excerpt.substring(0, 160),
            h1: post.title,
          }
        });
      }
    }
  }

  const allPosts = await prisma.post.findMany({ select: { id: true }, take: 1000 }); // limit for comments
  const postIds = allPosts.map(p => p.id);
  log(`Total posts available for commenting: ${postIds.length}`);

  // Comments
  const existingCommentsCount = await prisma.comment.count();
  const commentsToCreate = Math.max(0, v.comments - existingCommentsCount);
  if (commentsToCreate > 0) {
    const userIds = authors.map(a => a.user.id); // use authors as commenters too for variety
    log(`Creating ${commentsToCreate} comments...`);
    for (let i = 0; i < commentsToCreate; i += BATCH_SIZE) {
      const batch = Array.from({ length: Math.min(BATCH_SIZE, commentsToCreate - i) }).map(() => ({
        postId: getRandomItem(postIds),
        userId: getRandomItem(userIds),
        content: faker.lorem.sentence(),
        status: CommentStatus.approved,
        createdAt: faker.date.past({ years: 1 }),
      }));
      await prisma.comment.createMany({ data: batch });
    }
  }
  log(`Seeded comments.`);
}

async function seedDirectory(cityIds: bigint[], adminId: bigint, mediaIds: bigint[], serviceIds: bigint[], specialtyIds: bigint[], regularUserIds: bigint[]) {
  logStep('Seeding Directory (Salons & Artists)');

  // Salons
  const salonsCount = await prisma.salon.count();
  const salonsToCreate = Math.max(0, v.salons - salonsCount);
  if (salonsToCreate > 0) {
    log(`Creating ${salonsToCreate} salons...`);
    for (let i = 0; i < salonsToCreate; i++) {
      const name = "سالن زیبایی " + faker.person.firstName();
      const slug = fakerEn.helpers.slugify(name).toLowerCase() + '-' + faker.string.alphanumeric(5);
      const cityId = getRandomItem(cityIds);
      const neighborhood = await prisma.neighborhood.findFirst({ where: { cityId } });

      const salon = await prisma.salon.create({
        data: {
          name,
          slug,
          summary: faker.lorem.sentence(),
          description: faker.lorem.paragraph(),
          phone: faker.phone.number(),
          cityId,
          neighborhoodId: neighborhood?.id,
          addressLine: faker.location.streetAddress(),
          status: AccountStatus.ACTIVE,
          verification: VerificationStatus.VERIFIED,
          avatarMediaId: getRandomItem(mediaIds),
          coverMediaId: getRandomItem(mediaIds),
          avgRating: faker.number.float({ min: 3, max: 5, multipleOf: 0.1 }),
          reviewCount: faker.number.int({ min: 0, max: 500 }),
          primaryOwnerId: adminId,
        }
      });

      // Salon Services
      const selectedServices = getRandomItems(serviceIds, faker.number.int({ min: 3, max: 10 }));
      await prisma.salonService.createMany({
        data: selectedServices.map(sid => ({ salonId: salon.id, serviceId: sid })),
        skipDuplicates: true,
      });
    }
  }

  // Artists
  const artistsCount = await prisma.artist.count();
  const artistsToCreate = Math.max(0, v.artists - artistsCount);
  if (artistsToCreate > 0) {
    log(`Creating ${artistsToCreate} artists...`);
    for (let i = 0; i < artistsToCreate; i++) {
      const name = faker.person.fullName();
      const slug = fakerEn.helpers.slugify(name).toLowerCase() + '-' + faker.string.alphanumeric(5);

      const artist = await prisma.artist.create({
        data: {
          fullName: name,
          slug,
          summary: faker.lorem.sentence(),
          bio: faker.lorem.paragraph(),
          phone: faker.phone.number(),
          cityId: getRandomItem(cityIds),
          status: AccountStatus.ACTIVE,
          verification: VerificationStatus.VERIFIED,
          avatarMediaId: getRandomItem(mediaIds),
          coverMediaId: getRandomItem(mediaIds),
          avgRating: faker.number.float({ min: 3, max: 5, multipleOf: 0.1 }),
          reviewCount: faker.number.int({ min: 0, max: 300 }),
          primaryOwnerId: adminId,
        }
      });

      // Artist Specialties
      const selectedSpecs = getRandomItems(specialtyIds, faker.number.int({ min: 1, max: 3 }));
      await prisma.artistSpecialty.createMany({
        data: selectedSpecs.map(sid => ({ artistId: artist.id, specialtyId: sid })),
        skipDuplicates: true,
      });
    }
  }

  // Relations: SalonArtist
  const allSalons = await prisma.salon.findMany({ select: { id: true }, take: 100 });
  const allArtists = await prisma.artist.findMany({ select: { id: true }, take: 200 });

  log('Linking Salons and Artists...');
  for (const s of allSalons) {
    const linkedArtists = getRandomItems(allArtists, faker.number.int({ min: 1, max: 5 }));
    for (const a of linkedArtists) {
      await prisma.salonArtist.upsert({
        where: { salonId_artistId: { salonId: s.id, artistId: a.id } },
        update: {},
        create: {
          salonId: s.id,
          artistId: a.id,
          roleTitle: faker.person.jobTitle(),
          isActive: true,
          startedAt: faker.date.past(),
        }
      });
    }
  }

  // Reviews
  log(`Seeding reviews...`);
  const existingReviews = await prisma.review.count();
  const reviewsToCreate = Math.max(0, v.reviews - existingReviews);
  if (reviewsToCreate > 0 && regularUserIds.length > 0) {
    for (let i = 0; i < reviewsToCreate; i += BATCH_SIZE) {
      const batch = Array.from({ length: Math.min(BATCH_SIZE, reviewsToCreate - i) }).map(() => {
        const isSalon = faker.datatype.boolean();
        return {
          authorId: getRandomItem(regularUserIds),
          salonId: isSalon ? getRandomItem(allSalons).id : null,
          artistId: !isSalon ? getRandomItem(allArtists).id : null,
          rating: faker.number.int({ min: 1, max: 5 }),
          title: faker.lorem.words(3),
          body: faker.lorem.paragraph(),
          status: 'PUBLISHED' as any,
          createdAt: faker.date.past(),
        };
      });
      await prisma.review.createMany({ data: batch });
    }
  }
}

async function main() {
  log(`Starting seed in ${SEED_MODE} mode with ${SEED_VOLUME} volume...`);
  const startTime = Date.now();

  if (SEED_RESET) {
    log('RESET mode enabled. Cleaning up database...');
    // Order matters for deletion due to FKs
    const tables = [
      'blog_comment', 'blog_posttag', 'blog_revision', 'blog_postmedia', 'blog_post', 'blog_category', 'blog_tag', 'blog_series', 'blog_authorprofile',
      'ReviewVote', 'Review', 'Report', 'Follow', 'Save', 'SalonArtist', 'SalonService', 'ArtistSpecialty', 'ArtistCertification', 'VerificationDocument', 'VerificationRequest',
      'Salon', 'Artist', 'Neighborhood', 'CityStats', 'City', 'Province',
      'blog_media', 'users_user', 'SeoMeta', 'SlugHistory', 'RedirectRule', 'SitemapUrl', 'auth_otp', 'auth_refreshtoken'
    ];
    for (const table of tables) {
      try {
        await prisma.$executeRawUnsafe(`TRUNCATE TABLE "${table}" RESTART IDENTITY CASCADE;`);
      } catch (e) {
        // Some tables might not exist or have different names in schema
        // log(`Could not truncate ${table}: ${e.message}`);
      }
    }
  }

  if (SEED_DRY_RUN) {
    log('DRY RUN enabled. Planned execution:');
    log(`- Mode: ${SEED_MODE}`);
    log(`- Volume: ${SEED_VOLUME}`);
    log(`- Modules: Users=${SEED_USERS}, Content=${SEED_CONTENT}, Media=${SEED_MEDIA}, Geo=${SEED_GEO}, Directory=${SEED_DIRECTORY}`);
    log(`- Estimated records: Users=${v.users}, Posts=${v.posts}, Comments=${v.comments}, Salons=${v.salons}, Artists=${v.artists}`);
    return;
  }

  // Execution
  let cityIds: bigint[] = [];
  if (SEED_GEO) {
    const geo = await seedGeography();
    cityIds = geo.cityIds;
  } else {
    const existingCities = await prisma.city.findMany({ select: { id: true } });
    cityIds = existingCities.map(c => c.id);
  }

  let adminUser: any;
  let authorsList: any[] = [];
  let regularUserIds: bigint[] = [];

  if (SEED_USERS) {
    const usersData = await seedUsers(cityIds);
    adminUser = usersData.admin;
    authorsList = usersData.authors;
    regularUserIds = usersData.regularUserIds;
  } else {
    adminUser = await prisma.user.findFirst({ where: { role: UserRole.ADMIN } });
    const authors = await prisma.user.findMany({ where: { role: UserRole.AUTHOR }, include: { authorProfile: true } });
    authorsList = authors.map(u => ({ user: u, profile: u.authorProfile }));
    const regulars = await prisma.user.findMany({ where: { role: UserRole.USER }, select: { id: true } });
    regularUserIds = regulars.map(u => u.id);
  }

  if (!adminUser && (SEED_MEDIA || SEED_DIRECTORY)) {
    log('Warning: No admin user found for media/directory ownership. Some steps may fail.');
  }

  let mediaIds: bigint[] = [];
  if (SEED_MEDIA) {
    mediaIds = await seedMedia(adminUser?.id || BigInt(1));
  } else {
    const existingMedia = await prisma.media.findMany({ select: { id: true }, take: 100 });
    mediaIds = existingMedia.map(m => m.id);
  }

  const taxonomy = await seedTaxonomy();

  if (SEED_CONTENT) {
    await seedBlog(authorsList, taxonomy.categories, taxonomy.tags, mediaIds);
  }

  if (SEED_DIRECTORY) {
    await seedDirectory(cityIds, adminUser?.id || BigInt(1), mediaIds, taxonomy.serviceDefinitionIds, taxonomy.specialtyIds, regularUserIds);
  }

  const duration = ((Date.now() - startTime) / 1000).toFixed(2);
  log(`Seeding completed in ${duration}s.`);
  log(`
    - Users: ${await prisma.user.count()}
    - Posts: ${await prisma.post.count()}
    - Comments: ${await prisma.comment.count()}
    - Salons: ${await prisma.salon.count()}
    - Artists: ${await prisma.artist.count()}
    - Reviews: ${await prisma.review.count()}
  `);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
