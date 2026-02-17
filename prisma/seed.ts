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
  PlanTier,
  SubscriptionStatus,
  ReviewStatus,
} from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

const log = (msg: string) => console.log(`[SEED] ${msg}`);
const logStep = (step: string) => console.log(`\n--- [${step}] ---`);

async function hashPassword(password: string) {
  return bcrypt.hash(password, 10);
}

// --- REALISTIC DATA ---

const CITIES = [
  { nameFa: 'تهران', nameEn: 'Tehran', slug: 'tehran', lat: 35.6892, lng: 51.3890, province: 'تهران' },
  { nameFa: 'اصفهان', nameEn: 'Isfahan', slug: 'isfahan', lat: 32.6546, lng: 51.6680, province: 'اصفهان' },
  { nameFa: 'شیراز', nameEn: 'Shiraz', slug: 'shiraz', lat: 29.5918, lng: 52.5837, province: 'فارس' },
  { nameFa: 'تبریز', nameEn: 'Tabriz', slug: 'tabriz', lat: 38.0962, lng: 46.2731, province: 'آذربایجان شرقی' },
  { nameFa: 'مشهد', nameEn: 'Mashhad', slug: 'mashhad', lat: 36.2972, lng: 59.6067, province: 'خراسان رضوی' },
];

const SERVICE_CATEGORIES = [
  { nameFa: 'خدمات مو', slug: 'hair-services', services: ['کوتاهی تخصصی', 'رنگ و لایت', 'کراتینه و احیا', 'شینیون عروس', 'بافت مو'] },
  { nameFa: 'خدمات ناخن', slug: 'nail-services', services: ['کاشت پودر و ژل', 'مانیکور و پدیکور', 'طراحی و دیزاین', 'لمینت ناخن'] },
  { nameFa: 'آرایش و گریم', slug: 'makeup-services', services: ['میکاپ تخصصی عروس', 'گریم شب', 'آرایش محفلی', 'نصب مژه'] },
  { nameFa: 'خدمات پوست', slug: 'skin-services', services: ['فیشیال کلاسیک', 'پاکسازی عمقی', 'میکرونیدلینگ', 'ماساژ صورت'] },
];

const SPECIALTIES = [
  { nameFa: 'متخصص رنگ و مش', slug: 'color-expert' },
  { nameFa: 'ناخن‌کار حرفه‌ای', slug: 'nail-master' },
  { nameFa: 'میکاپ آرتیست عروس', slug: 'bridal-makeup' },
  { nameFa: 'هیر استایلیست', slug: 'hair-stylist' },
  { nameFa: 'تکنیسین فیشیال', slug: 'facial-tech' },
];

const SALONS = [
  { name: 'سالن زیبایی رز طلایی', slug: 'golden-rose-beauty', city: 'tehran', tier: PlanTier.VIP, phone: '02122003344', bio: 'ارائه دهنده لوکس‌ترین خدمات زیبایی در شمال تهران با کادری مجرب و محیطی آرام.' },
  { name: 'مجموعه زیبایی نیل', slug: 'neil-beauty-complex', city: 'isfahan', tier: PlanTier.PRO, phone: '03136607788', bio: 'تخصص ما در خدمات ناخن و پدیکور است. زیبایی دستان خود را به ما بسپارید.' },
  { name: 'عمارت زیبایی ونوس', slug: 'venus-mansion', city: 'tehran', tier: PlanTier.VIP, phone: '02188009900', bio: 'اولین عمارت تخصصی عروس در غرب تهران با برندهای مطرح جهانی.' },
  { name: 'آرایشگاه تخصصی مریم', slug: 'maryam-specialist', city: 'shiraz', tier: PlanTier.PRO, phone: '07132204455', bio: 'بیش از ۱۰ سال سابقه درخشان در زمینه کوتاهی و رنگ مو.' },
  { name: 'کلینیک زیبایی لاوین', slug: 'lavin-clinic', city: 'tabriz', tier: PlanTier.FREE, phone: '04133301122', bio: 'خدمات پاکسازی و مراقبت از پوست با دستگاه‌های پیشرفته.' },
  { name: 'سالن زیبایی دیاموند', slug: 'diamond-salon', city: 'mashhad', tier: PlanTier.PRO, phone: '05138806677', bio: 'خدمات تخصصی میکاپ و شینیون در نزدیکی حرم مطهر.' },
  { name: 'مرکز زیبایی پرنسس', slug: 'princess-center', city: 'tehran', tier: PlanTier.FREE, phone: '02144005566', bio: 'محیطی دوستانه و قیمت‌های مناسب برای خدمات روزانه زیبایی.' },
  { name: 'آتلیه زیبایی صدف', slug: 'sadaf-beauty-atelier', city: 'shiraz', tier: PlanTier.VIP, phone: '07136602233', bio: 'هنر زیبایی را در آتلیه صدف تجربه کنید. متخصص در گریم‌های سینمایی.' },
  { name: 'سالن قصر زیبایی', slug: 'beauty-palace', city: 'isfahan', tier: PlanTier.FREE, phone: '03134405544', bio: 'تمامی خدمات زیبایی از سر تا پا با بهترین مواد اولیه.' },
  { name: 'مرکز ناخن سپیده', slug: 'sepideh-nail-center', city: 'mashhad', tier: PlanTier.PRO, phone: '05137701122', bio: 'بزرگترین مرکز تخصصی کاشت و طراحی ناخن در شرق کشور.' },
  { name: 'آرایشگاه تخصصی آرا', slug: 'ara-specialist', city: 'tabriz', tier: PlanTier.PRO, phone: '04132209988', bio: 'ارائه متدهای نوین آرایشی با استفاده از بهترین برندهای روز دنیا.' },
  { name: 'خانه زیبایی پریا', slug: 'paria-beauty-house', city: 'tehran', tier: PlanTier.VIP, phone: '02122334455', bio: 'محیطی کاملاً اختصاصی برای بانوان شیک‌پوش در قلب زعفرانیه.' },
  { name: 'سالن زیبایی ماهور', slug: 'mahoor-salon', city: 'isfahan', tier: PlanTier.FREE, phone: '03132201144', bio: 'خدمات سریع و با کیفیت برای مشتریان پرمشغله.' },
  { name: 'مرکز تخصصی موی سایه', slug: 'sayeh-hair-center', city: 'shiraz', tier: PlanTier.PRO, phone: '07136224488', bio: 'تخصص ما احیا و سلامت موهای شماست. با ما دوباره بدرخشید.' },
  { name: 'آرایشگاه کلاسیک آذین', slug: 'azin-classic', city: 'mashhad', tier: PlanTier.FREE, phone: '05138442211', bio: 'بیش از ۲۰ سال تجربه در هنر سنتی آرایشگری و پیرایش.' },
  { name: 'سالن زیبایی آفتاب', slug: 'aftab-beauty', city: 'tehran', tier: PlanTier.PRO, phone: '02188776655', bio: 'ارائه کلیه خدمات آرایشی در محیطی آرام و صمیمی.' },
  { name: 'کلینیک تخصصی نوبل', slug: 'noble-clinic', city: 'shiraz', tier: PlanTier.VIP, phone: '07132334455', bio: 'پیشرفته‌ترین مرکز زیبایی و لیزر در جنوب کشور.' },
  { name: 'خانه زیبایی الیه', slug: 'elyeh-beauty', city: 'tehran', tier: PlanTier.FREE, phone: '02144556677', bio: 'تیم حرفه‌ای ما آماده خدمت‌رسانی به شما عزیزان در تمامی زمینه‌هاست.' },
  { name: 'مرکز تخصصی پوست بهاران', slug: 'baharan-skin', city: 'mashhad', tier: PlanTier.PRO, phone: '05136609988', bio: 'تخصص ما شادابی و جوانی پوست شماست.' },
  { name: 'سالن زیبایی میترا', slug: 'mitra-beauty', city: 'isfahan', tier: PlanTier.FREE, phone: '03139908877', bio: 'ارائه خدمات با کیفیت با نازل‌ترین قیمت‌ها.' },
];

const FIRST_NAMES = ['سارا', 'مهناز', 'نیلوفر', 'مریم', 'الناز', 'بهاره', 'رها', 'شیوا', 'درسا', 'کیمیا', 'مینا', 'هستی', 'پریسا', 'شقایق', 'غزاله', 'آیدا', 'یاسمن', 'تینا', 'سپیده', 'رویا', 'نگار', 'لیلا', 'ثنا', 'مونا', 'پریناز', 'آتوسا', 'بیتا', 'دنیا', 'ژاله', 'هانیه'];
const LAST_NAMES = ['رضایی', 'کریمی', 'آذر', 'حسینی', 'محمدی', 'افشاری', 'سعیدی', 'امینی', 'ابراهیمی', 'تابش', 'رحیمی', 'باقری', 'نوری', 'دهقان', 'راد', 'کیانی', 'ملکی', 'بهرامی', 'گلچین', 'تیموریان', 'علوی', 'قاسمی', 'احمدی', 'صالحی', 'مرادی', 'انصاری', 'طاهری', 'عباسی', 'نیکزاد', 'پورمند'];

const REVIEWS = [
  { rating: 5, author: 'زهرا علوی', text: 'واقعا کارشون عالیه. من برای عروسیم رفتم پیش سارا رضایی و خیلی راضی بودم. آرایشم تا آخر شب اصلا تکون نخورد.' },
  { rating: 4, author: 'مونا کرمی', text: 'محیط سالن رز طلایی خیلی شیکه. برخورد پرسنل هم خوب بود. فقط کمی معطلی داشتیم.' },
  { rating: 5, author: 'سمیه حیدری', text: 'بهترین ناخن‌کاری که تا حالا رفتم نیلوفر آذر بوده. خیلی با دقت و ظرافت کار می‌کنه.' },
  { rating: 3, author: 'لیلا زمانی', text: 'کار رنگ موشون خوبه ولی قیمتشون نسبت به منطقه یکم بالاست.' },
  { rating: 5, author: 'آرزو افشار', text: 'فیشیال پوست رو در کلینیک لاوین امتحان کردم. پوستم واقعا روشن و شفاف شده.' },
  { rating: 4, author: 'هانیه نوری', text: 'میکاپ شب عالی بود، ممنون از خانم افشاری.' },
  { rating: 2, author: 'نرگس محمدی', text: 'متاسفانه وقت‌دهی‌شون اصلا خوب نیست. من دو ساعت منتظر موندم با اینکه وقت قبلی داشتم.' },
  { rating: 5, author: 'فاطمه رضوان', text: 'سالن ونوس واقعا یه عمارت رویاییه. همه چیز عالی بود.' },
];

const BLOG_POSTS = [
  { title: '۱۰ نکته حیاتی برای مراقبت از موهای رنگ شده', slug: 'hair-care-tips-dyed', excerpt: 'چگونه درخشندگی موهای خود را بعد از رنگ کردن حفظ کنیم؟ در این مقاله به بررسی راهکارهای عملی می‌پردازیم.', content: 'متن کامل مقاله درباره مراقبت از مو...' },
  { title: 'جدیدترین ترندهای میکاپ عروس در سال ۲۰۲۴', slug: 'bridal-makeup-trends-2024', excerpt: 'از میکاپ نود تا آرایش‌های کلاسیک؛ چه سبکی برای شما مناسب است؟', content: 'بررسی سبک‌های مختلف میکاپ عروس...' },
  { title: 'تفاوت کاشت ناخن پودری و ژل چیست؟', slug: 'powder-vs-gel-nails', excerpt: 'انتخاب درست بین پودر و ژل می‌تواند به سلامت ناخن‌های شما کمک کند.', content: 'مقایسه جامع متدهای کاشت ناخن...' },
  { title: 'فیشیال پوست: چرا هر ماه به آن نیاز دارید؟', slug: 'why-monthly-facial', excerpt: 'فواید پاکسازی دوره‌ای پوست برای جلوگیری از پیری زودرس.', content: 'توضیحات علمی درباره فیشیال...' },
];

// --- SEEDING LOGIC ---

async function main() {
  logStep('Cleaning up database');
  const tables = [
    'blog_comment', 'blog_posttag', 'blog_revision', 'blog_postmedia', 'blog_post', 'blog_category', 'blog_tag', 'blog_series', 'blog_authorprofile',
    'ReviewVote', 'Review', 'Report', 'Follow', 'Save', 'SalonArtist', 'SalonService', 'ArtistSpecialty', 'ArtistCertification', 'VerificationDocument', 'VerificationRequest',
    'Salon', 'Artist', 'Neighborhood', 'CityStats', 'City', 'Province',
    'blog_media', 'users_user', 'SeoMeta', 'SlugHistory', 'RedirectRule', 'SitemapUrl', 'auth_otp', 'auth_refreshtoken', 'billing_history', 'billing_subscription', 'billing_plan'
  ];
  for (const table of tables) {
    try {
      await prisma.$executeRawUnsafe(`TRUNCATE TABLE "${table}" RESTART IDENTITY CASCADE;`);
    } catch (e) {}
  }

  logStep('Seeding Geography');
  const provinces: Record<string, bigint> = {};
  for (const city of CITIES) {
    if (!provinces[city.province]) {
      const p = await prisma.province.create({
        data: { nameFa: city.province, slug: city.slug + '-province' }
      });
      provinces[city.province] = p.id;
    }
  }

  const cityMap: Record<string, bigint> = {};
  const citySlugs: string[] = [];
  for (const city of CITIES) {
    const c = await prisma.city.create({
      data: {
        provinceId: provinces[city.province],
        nameFa: city.nameFa,
        nameEn: city.nameEn,
        slug: city.slug,
        lat: city.lat,
        lng: city.lng,
      }
    });
    cityMap[city.slug] = c.id;
    citySlugs.push(city.slug);
  }

  logStep('Seeding Users');
  const password = await hashPassword('Admin@123');
  const admin = await prisma.user.create({
    data: {
      username: 'admin',
      email: 'admin@sevra.ir',
      password,
      firstName: 'مدیریت',
      lastName: 'سیستم',
      phoneNumber: '+989001112233',
      isStaff: true,
      isActive: true,
      role: UserRole.ADMIN,
      referralCode: 'SEVRA_HQ',
    }
  });

  const staff = await prisma.user.create({
    data: {
      username: 'elnaz_editor',
      email: 'elnaz@sevra.ir',
      password,
      firstName: 'الناز',
      lastName: 'کریمی',
      phoneNumber: '+989120001122',
      isStaff: true,
      isActive: true,
      role: UserRole.AUTHOR,
      referralCode: 'ELNAZ_AUTH',
    }
  });

  await prisma.authorProfile.create({
    data: {
      userId: staff.id,
      displayName: 'الناز کریمی',
      bio: 'سردبیر بخش زیبایی و سلامت سورا. با بیش از ۱۵ سال تجربه در حوزه مد و آرایش.',
    }
  });

  const users: bigint[] = [];
  for (let i = 0; i < 30; i++) {
    const user = await prisma.user.create({
      data: {
        username: 'user_' + Math.random().toString(36).substring(7),
        email: `user${i}@example.com`,
        firstName: FIRST_NAMES[i % FIRST_NAMES.length],
        lastName: LAST_NAMES[i % LAST_NAMES.length],
        phoneNumber: '+989' + (9100000000 + i),
        isActive: true,
        isStaff: false,
        role: UserRole.USER,
        referralCode: 'REF' + i,
      }
    });
    users.push(user.id);
  }

  logStep('Seeding Plans');
  const planTiers = [PlanTier.FREE, PlanTier.PRO, PlanTier.VIP];
  const plans: Record<string, bigint> = {};
  for (const tier of planTiers) {
    const plan = await prisma.plan.create({
      data: {
        name: `طرح ${tier} ویژه سالن‌ها`,
        tier: tier,
        entityType: EntityType.SALON,
        price: tier === 'FREE' ? 0n : tier === 'PRO' ? 1500000n : 5000000n,
        durationDays: 30,
        features: { priority: tier === 'FREE' ? 0 : tier === 'PRO' ? 1 : 2 },
      }
    });
    plans[`SALON_${tier}`] = plan.id;
  }

  logStep('Seeding Taxonomy');
  const serviceDefs: bigint[] = [];
  for (const cat of SERVICE_CATEGORIES) {
    const category = await prisma.serviceCategory.create({
      data: { nameFa: cat.nameFa, slug: cat.slug }
    });
    for (const sName of cat.services) {
      const s = await prisma.serviceDefinition.create({
        data: {
          categoryId: category.id,
          nameFa: sName,
          slug: sName.replace(/ /g, '-').toLowerCase(),
        }
      });
      serviceDefs.push(s.id);
    }
  }

  const specIds: bigint[] = [];
  for (const spec of SPECIALTIES) {
    const s = await prisma.specialty.create({
      data: { nameFa: spec.nameFa, slug: spec.slug }
    });
    specIds.push(s.id);
  }

  logStep('Seeding Salons');
  const salonIds: bigint[] = [];
  for (const s of SALONS) {
    const salon = await prisma.salon.create({
      data: {
        name: s.name,
        slug: s.slug,
        cityId: cityMap[s.city],
        phone: s.phone,
        summary: s.bio.substring(0, 100),
        description: s.bio,
        status: AccountStatus.ACTIVE,
        verification: VerificationStatus.VERIFIED,
        planId: plans[`SALON_${s.tier}`],
        primaryOwnerId: admin.id,
        visibilityScore: s.tier === 'VIP' ? 100 : s.tier === 'PRO' ? 50 : 10,
        avgRating: 4.0 + Math.random(),
        reviewCount: Math.floor(Math.random() * 50),
      }
    });
    salonIds.push(salon.id);

    // Subscriptions
    await prisma.subscription.create({
      data: {
        planId: plans[`SALON_${s.tier}`],
        salonId: salon.id,
        status: SubscriptionStatus.ACTIVE,
        startDate: new Date(),
        endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      }
    });
  }

  logStep('Seeding Artists');
  const artistIds: bigint[] = [];
  for (let i = 0; i < 60; i++) {
    const firstName = FIRST_NAMES[i % FIRST_NAMES.length];
    const lastName = LAST_NAMES[i % LAST_NAMES.length];
    const fullName = `${firstName} ${lastName}`;
    const slug = `artist-${i}-${Math.random().toString(36).substring(7)}`;

    const artist = await prisma.artist.create({
      data: {
        fullName,
        slug,
        cityId: cityMap[citySlugs[i % citySlugs.length]],
        bio: `تخصص در لاین‌های مختلف زیبایی با بیش از ${Math.floor(Math.random() * 15) + 2} سال سابقه کار حرفه‌ای.`,
        status: AccountStatus.ACTIVE,
        primaryOwnerId: admin.id,
        verification: VerificationStatus.VERIFIED,
        avgRating: 4.2 + Math.random() * 0.8,
        reviewCount: Math.floor(Math.random() * 30),
      }
    });
    artistIds.push(artist.id);

    await prisma.artistSpecialty.create({
      data: {
        artistId: artist.id,
        specialtyId: specIds[i % specIds.length],
      }
    });

    // Link to 1-2 random salons
    const salonCount = Math.floor(Math.random() * 2) + 1;
    for (let j = 0; j < salonCount; j++) {
      const randomSalon = salonIds[Math.floor(Math.random() * salonIds.length)];
      await prisma.salonArtist.upsert({
        where: { salonId_artistId: { salonId: randomSalon, artistId: artist.id } },
        update: {},
        create: {
          salonId: randomSalon,
          artistId: artist.id,
          roleTitle: 'متخصص تراز اول',
          isActive: true,
        }
      });
    }
  }

  logStep('Seeding Reviews');
  for (let i = 0; i < REVIEWS.length * 5; i++) {
    const r = REVIEWS[i % REVIEWS.length];
    await prisma.review.create({
      data: {
        authorId: users[i % users.length],
        salonId: salonIds[i % salonIds.length],
        rating: r.rating,
        title: 'تجربه خدمات',
        body: r.text,
        status: ReviewStatus.PUBLISHED,
      }
    });
  }

  logStep('Seeding Blog Posts');
  for (const p of BLOG_POSTS) {
    await prisma.post.create({
      data: {
        title: p.title,
        slug: p.slug,
        excerpt: p.excerpt,
        content: p.content,
        authorId: staff.id,
        status: PostStatus.published,
        visibility: PostVisibility.public,
        publishedAt: new Date(),
      }
    });
  }

  logStep('Seeding completed successfully!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
