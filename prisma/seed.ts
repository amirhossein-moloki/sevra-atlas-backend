import { PrismaClient, UserRole, AccountStatus, PostStatus, EntityType, MediaKind } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding production-like data...');

  // 1. Users & Profiles
  const admin = await prisma.user.upsert({
    where: { username: 'admin' },
    update: {},
    create: {
      username: 'admin',
      firstName: 'Admin',
      lastName: 'Sevra',
      email: 'admin@sevra.ir',
      phoneNumber: '+989120000001',
      isStaff: true,
      isActive: true,
      isPhoneVerified: true,
      role: UserRole.ADMIN,
      referralCode: 'ADMIN01',
    },
  });

  const authorUser = await prisma.user.upsert({
    where: { username: 'maryam_beauty' },
    update: {},
    create: {
      username: 'maryam_beauty',
      firstName: 'مریم',
      lastName: 'احمدی',
      email: 'maryam@sevra.ir',
      phoneNumber: '+989120000002',
      isStaff: true,
      isActive: true,
      isPhoneVerified: true,
      role: UserRole.AUTHOR,
      referralCode: 'MARYAM01',
    },
  });

  await prisma.authorProfile.upsert({
    where: { userId: authorUser.id },
    update: {},
    create: {
      userId: authorUser.id,
      displayName: 'مریم احمدی',
      bio: 'کارشناس زیبایی و گریم با ۱۰ سال سابقه.',
    },
  });

  // 2. Geography
  const tehran = await prisma.province.upsert({
    where: { slug: 'tehran' },
    update: {},
    create: {
      nameFa: 'تهران',
      nameEn: 'Tehran',
      slug: 'tehran',
    },
  });

  const tehranCity = await prisma.city.upsert({
    where: { provinceId_slug: { provinceId: tehran.id, slug: 'tehran' } },
    update: {},
    create: {
      provinceId: tehran.id,
      nameFa: 'تهران',
      nameEn: 'Tehran',
      slug: 'tehran',
      lat: 35.6892,
      lng: 51.3890,
    },
  });

  const saadatAbad = await prisma.neighborhood.upsert({
    where: { cityId_slug: { cityId: tehranCity.id, slug: 'saadat-abad' } },
    update: {},
    create: {
      cityId: tehranCity.id,
      nameFa: 'سعادت‌آباد',
      slug: 'saadat-abad',
    },
  });

  // 3. Media
  // Note: Using upsert for Media is tricky because it doesn't have a natural unique key other than ID.
  // We'll just create if not exists by checking storageKey if we had one, but here we'll use create.
  // To make it idempotent, we'll check first.
  let salonAvatar = await prisma.media.findFirst({ where: { storageKey: 'salons/1/avatar.jpg' } });
  if (!salonAvatar) {
    salonAvatar = await prisma.media.create({
      data: {
        storageKey: 'salons/1/avatar.jpg',
        url: 'https://cdn.sevra.ir/salons/1/avatar.jpg',
        type: 'image',
        mime: 'image/jpeg',
        width: 500,
        height: 500,
        sizeBytes: 102400,
        altText: 'سالن زیبایی لوتوس',
        kind: MediaKind.AVATAR,
        uploadedBy: admin.id,
      }
    });
  }

  // 4. Salons
  const lotusSalon = await prisma.salon.upsert({
    where: { slug: 'lotus-beauty' },
    update: {},
    create: {
      name: 'سالن زیبایی لوتوس',
      slug: 'lotus-beauty',
      summary: 'مجهزترین مرکز زیبایی در شمال تهران',
      description: 'سالن زیبایی لوتوس با کادری مجرب و محیطی آرام آماده ارائه انواع خدمات زیبایی به شما عزیزان می‌باشد.',
      phone: '02122334455',
      cityId: tehranCity.id,
      neighborhoodId: saadatAbad.id,
      addressLine: 'سعادت‌آباد، خیابان سرو غربی، پلاک ۱',
      status: AccountStatus.ACTIVE,
      avatarMediaId: salonAvatar.id,
      avgRating: 4.8,
      reviewCount: 120,
      primaryOwnerId: admin.id,
    }
  });

  // 5. Taxonomy (Services & Specialties)
  const hairCategory = await prisma.serviceCategory.upsert({
    where: { slug: 'hair-care' },
    update: {},
    create: { nameFa: 'خدمات مو', slug: 'hair-care', order: 1 }
  });

  const haircut = await prisma.serviceDefinition.upsert({
    where: { slug: 'haircut' },
    update: {},
    create: {
      nameFa: 'کوتاهی مو',
      slug: 'haircut',
      categoryId: hairCategory.id,
      description: 'انواع مدل‌های کوتاهی ژورنالی'
    }
  });

  await prisma.salonService.upsert({
    where: { salonId_serviceId: { salonId: lotusSalon.id, serviceId: haircut.id } },
    update: {},
    create: { salonId: lotusSalon.id, serviceId: haircut.id, notes: 'با تعیین وقت قبلی' }
  });

  const makeupSpecialty = await prisma.specialty.upsert({
    where: { slug: 'makeup-artist' },
    update: {},
    create: { nameFa: 'میکاپ آرتیست', slug: 'makeup-artist', order: 1 }
  });

  // 6. Artists
  const saraArtist = await prisma.artist.upsert({
    where: { slug: 'sara-makeup' },
    update: {},
    create: {
      fullName: 'سارا کریمی',
      slug: 'sara-makeup',
      summary: 'متخصص میکاپ عروس',
      bio: 'سارا کریمی با مدرک بین‌المللی از آکادمی‌های معتبر.',
      cityId: tehranCity.id,
      status: AccountStatus.ACTIVE,
      avgRating: 4.9,
      reviewCount: 45,
    }
  });

  // Check if relation already exists to avoid unique constraint error on non-upsertable relation tables
  const artistSpecialtyExists = await prisma.artistSpecialty.findUnique({
    where: { artistId_specialtyId: { artistId: saraArtist.id, specialtyId: makeupSpecialty.id } }
  });
  if (!artistSpecialtyExists) {
    await prisma.artistSpecialty.create({
      data: { artistId: saraArtist.id, specialtyId: makeupSpecialty.id }
    });
  }

  const salonArtistExists = await prisma.salonArtist.findUnique({
    where: { salonId_artistId: { salonId: lotusSalon.id, artistId: saraArtist.id } }
  });
  if (!salonArtistExists) {
    await prisma.salonArtist.create({
      data: { salonId: lotusSalon.id, artistId: saraArtist.id, roleTitle: 'میکاپ آرتیست اصلی' }
    });
  }

  // 7. Blog
  const blogCategory = await prisma.category.upsert({
    where: { slug: 'beauty-tips' },
    update: {},
    create: {
      name: 'نکات زیبایی',
      slug: 'beauty-tips',
      description: 'جدیدترین ترفندهای آرایشی و بهداشتی',
    }
  });

  const post = await prisma.post.upsert({
    where: { slug: 'skincare-routine-2024' },
    update: {},
    create: {
      title: 'روتین مراقبت از پوست در سال ۲۰۲۴',
      slug: 'skincare-routine-2024',
      excerpt: 'چگونه پوستی شفاف و سالم داشته باشیم؟',
      content: 'در این مقاله به بررسی جدیدترین متدهای مراقبت از پوست می‌پردازیم...',
      status: PostStatus.published,
      publishedAt: new Date(),
      authorId: authorUser.id,
      categoryId: blogCategory.id,
    }
  });

  // 8. SEO
  await prisma.seoMeta.upsert({
    where: { entityType_entityId: { entityType: EntityType.BLOG_POST, entityId: post.id } },
    update: {},
    create: {
      entityType: EntityType.BLOG_POST,
      entityId: post.id,
      title: 'بهترین روتین پوستی ۲۰۲۴ | سِورا',
      description: 'با مطالعه این مقاله، پوستی درخشان داشته باشید. نکات اختصاصی سِورا.',
      h1: 'همه چیز درباره روتین مراقبت از پوست',
    }
  });

  console.log('Seeding completed successfully.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
