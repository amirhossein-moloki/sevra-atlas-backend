import { PrismaClient } from '@prisma/client';
import fs from 'fs';
import path from 'path';

const prisma = new PrismaClient();

async function main() {
  console.log('🚀 Starting Bahar Afshari profile update...');

  // 1. Ensure Specialties exist
  const specialtyNames = [
    { name: 'میکاپ تخصصی عروس', slug: 'bridal-makeup' },
    { name: 'آموزش گریم و میکاپ', slug: 'makeup-training' },
    { name: 'شینیون حرفه‌ای', slug: 'pro-hairstyling' },
    { name: 'خدمات تخصصی ناخن', slug: 'nail-services' },
    { name: 'فیشیال و پاکسازی پوست', slug: 'facial-skin-care' },
    { name: 'کانتورینگ حرفه‌ای', slug: 'pro-contouring' },
    { name: 'گریم سینمایی', slug: 'cinematic-makeup' },
    { name: 'بافت مو تخصصی', slug: 'specialized-braiding' },
    { name: 'اکستنشن مو', slug: 'hair-extension' },
    { name: 'کاشت ناخن پودری', slug: 'powder-nail-extension' },
    { name: 'طراحی ناخن (دیزاین)', slug: 'nail-design' },
    { name: 'پاکسازی تخصصی پوست', slug: 'pro-skin-cleansing' },
    { name: 'ماساژ صورت و جوانسازی', slug: 'face-massage' },
  ];

  const specialtyMap: Record<string, any> = {};
  for (const s of specialtyNames) {
    const specialty = await prisma.specialty.upsert({
      where: { slug: s.slug },
      update: { nameFa: s.name },
      create: { nameFa: s.name, slug: s.slug },
    });
    specialtyMap[s.slug] = specialty;
  }

  // 2. Find or Create Owner User
  const owner = await prisma.user.upsert({
    where: { username: 'baharaafshari' },
    update: {},
    create: {
      username: 'baharaafshari',
      email: 'info@baharaafshari.com',
      firstName: 'بهار',
      lastName: 'افشاری',
      phoneNumber: '09121881913',
      isActive: true,
      isStaff: false,
      role: 'ARTIST',
      referralCode: 'BAHAR_AF',
    },
  });

  // 3. Upsert Artist Profile
  const artist = await prisma.artist.upsert({
    where: { slug: 'bahar-afshari' },
    update: {
      fullName: 'بهار افشاری',
      bio: 'میکاپ آرتیست برتر و موسس آکادمی تخصصی بهار افشاری با بیش از ۱۰ سال سابقه درخشان در حوزه زیبایی عروس و آموزش هنرجویان حرفه‌ای. ارائه دهنده جدیدترین متدهای روز دنیا در قلب منطقه الهیه تهران.',
      summary: 'میکاپ آرتیست تخصصی عروس و مدرس رسمی گریم',
      phone: '09121881913',
      instagram: 'baharaafshari',
      status: 'ACTIVE',
      verification: 'VERIFIED',
    },
    create: {
      fullName: 'بهار افشاری',
      slug: 'bahar-afshari',
      bio: 'میکاپ آرتیست برتر و موسس آکادمی تخصصی بهار افشاری با بیش از ۱۰ سال سابقه درخشان در حوزه زیبایی عروس و آموزش هنرجویان حرفه‌ای. ارائه دهنده جدیدترین متدهای روز دنیا در قلب منطقه الهیه تهران.',
      summary: 'میکاپ آرتیست تخصصی عروس و مدرس رسمی گریم',
      phone: '09121881913',
      instagram: 'baharaafshari',
      primaryOwnerId: owner.id,
      status: 'ACTIVE',
      verification: 'VERIFIED',
    },
  });

  // 4. Link Artist to Specialties (Bahar gets the main ones)
  const baharSpecialties = [
    'bridal-makeup',
    'makeup-training',
    'pro-hairstyling',
    'nail-services',
    'facial-skin-care'
  ];

  for (const slug of baharSpecialties) {
    const s = specialtyMap[slug];
    await prisma.artistSpecialty.upsert({
      where: {
        artistId_specialtyId: {
          artistId: artist.id,
          specialtyId: s.id,
        },
      },
      update: {
        isActive: true,
        priceToman: BigInt(5000000), // Premium price for Bahar
        durationMin: 120,
      },
      create: {
        artistId: artist.id,
        specialtyId: s.id,
        isActive: true,
        priceToman: BigInt(5000000),
        durationMin: 120,
      },
    });
  }

  // 5. Upsert Salon Profile
  const salon = await prisma.salon.upsert({
    where: { slug: 'bahar-afshari-academy' },
    update: {
      name: 'آکادمی زیبایی بهار افشاری',
      addressLine: 'تهران، الهیه، خیابان فرشته، مرکز خرید کویین، طبقه سوم، واحد ۳۰۳',
      phone: '09121881913',
      instagram: 'baharaafshari',
      description: 'آکادمی و سالن زیبایی بهار افشاری، پیشرو در ارائه خدمات میکاپ عروس و آموزش‌های تخصصی آرایشگری در محیطی لوکس و حرفه‌ای.',
      summary: 'آکادمی تخصصی میکاپ و زیبایی در الهیه',
      status: 'ACTIVE',
      verification: 'VERIFIED',
    },
    create: {
      name: 'آکادمی زیبایی بهار افشاری',
      slug: 'bahar-afshari-academy',
      addressLine: 'تهران، الهیه، خیابان فرشته، مرکز خرید کویین، طبقه سوم، واحد ۳۰۳',
      phone: '09121881913',
      instagram: 'baharaafshari',
      description: 'آکادمی و سالن زیبایی بهار افشاری، پیشرو در ارائه خدمات میکاپ عروس و آموزش‌های تخصصی آرایشگری در محیطی لوکس و حرفه‌ای.',
      summary: 'آکادمی تخصصی میکاپ و زیبایی در الهیه',
      primaryOwnerId: owner.id,
      status: 'ACTIVE',
      verification: 'VERIFIED',
    },
  });

  // 6. Link Artist to Salon
  await prisma.salonArtist.upsert({
    where: {
      salonId_artistId: {
        salonId: salon.id,
        artistId: artist.id,
      },
    },
    update: {
      roleTitle: 'مدیریت و میکاپ آرتیست اصلی',
    },
    create: {
      salonId: salon.id,
      artistId: artist.id,
      roleTitle: 'مدیریت و میکاپ آرتیست اصلی',
      isActive: true,
    },
  });

  // 7. Add other employees as Artists and link to Salon
  const employees = [
    {
      name: 'لیلا افشاری',
      slug: 'leila-afshari',
      role: 'متخصص گریم و کانتورینگ',
      specialties: ['pro-contouring', 'cinematic-makeup']
    },
    {
      name: 'مریم راد',
      slug: 'maryam-rad',
      role: 'هیر استایلیست و شینیون',
      specialties: ['pro-hairstyling', 'hair-extension']
    },
    {
      name: 'سپیده حسینی',
      slug: 'sepideh-hosseini',
      role: 'ناخن‌کار حرفه‌ای',
      specialties: ['nail-services', 'nail-design']
    },
    {
      name: 'عاطفه امینی',
      slug: 'atefeh-amini',
      role: 'تکنیسین فیشیال پوست',
      specialties: ['facial-skin-care', 'pro-skin-cleansing']
    },
  ];

  for (const emp of employees) {
    const empArtist = await prisma.artist.upsert({
      where: { slug: emp.slug },
      update: { fullName: emp.name },
      create: {
        fullName: emp.name,
        slug: emp.slug,
        status: 'ACTIVE',
        verification: 'VERIFIED',
      },
    });

    await prisma.salonArtist.upsert({
      where: {
        salonId_artistId: {
          salonId: salon.id,
          artistId: empArtist.id,
        },
      },
      update: {
        roleTitle: emp.role,
      },
      create: {
        salonId: salon.id,
        artistId: empArtist.id,
        roleTitle: emp.role,
        isActive: true,
      },
    });

    // Add specialties for employees (2 specialties each as requested)
    for (const sSlug of emp.specialties) {
      const spec = specialtyMap[sSlug];
      if (spec) {
        await prisma.artistSpecialty.upsert({
          where: {
            artistId_specialtyId: {
              artistId: empArtist.id,
              specialtyId: spec.id,
            },
          },
          update: {
            isActive: true,
            priceToman: BigInt(1500000),
            durationMin: 90,
          },
          create: {
            artistId: empArtist.id,
            specialtyId: spec.id,
            isActive: true,
            priceToman: BigInt(1500000),
            durationMin: 90,
          },
        });
      }
    }
  }

  // 8. Add Images to Profile
  console.log('🖼️ Ingesting images...');
  const imagesData = JSON.parse(fs.readFileSync(path.join(__dirname, 'beauty_images.json'), 'utf8'));
  const imagesToIngest = imagesData.slice(0, 5); // Take first 5 for the profile

  for (let i = 0; i < imagesToIngest.length; i++) {
    const img = imagesToIngest[i];
    const kind = i === 0 ? 'AVATAR' : i === 1 ? 'COVER' : 'GALLERY';

    const media = await prisma.media.create({
      data: {
        url: img.url,
        storageKey: `external/bahar_${i}`,
        type: 'image',
        mime: 'image/jpeg',
        altText: img.alt,
        title: img.title,
        kind: kind as any,
        entityType: 'ARTIST',
        entityId: artist.id,
        status: 'COMPLETED',
        uploadedBy: owner.id,
      },
    });

    if (kind === 'AVATAR') {
      await prisma.artist.update({ where: { id: artist.id }, data: { avatarMediaId: media.id } });
    } else if (kind === 'COVER') {
      await prisma.artist.update({ where: { id: artist.id }, data: { coverMediaId: media.id } });
    }
  }

  console.log('✅ Bahar Afshari profile, salon, and images updated successfully!');
}

main()
  .catch((e) => {
    console.error('❌ Error updating profile:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
