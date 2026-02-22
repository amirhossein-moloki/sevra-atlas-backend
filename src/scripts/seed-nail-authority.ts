import { prisma } from '../shared/db/prisma';
import { EntityType, OrderStrategy, PostStatus } from '@prisma/client';
import { initSeoMeta } from '../shared/utils/seo';

async function seed() {
  console.log('🌱 Seeding Nail Authority...');

  // 1. Create Series
  const series = await prisma.series.upsert({
    where: { slug: 'nail-guide-tabriz' },
    update: {
      title: 'راهنمای کامل کاشت ناخن در تبریز',
      orderStrategy: OrderStrategy.manual,
    },
    create: {
      slug: 'nail-guide-tabriz',
      title: 'راهنمای کامل کاشت ناخن در تبریز',
      orderStrategy: OrderStrategy.manual,
      description: 'مجموعه مقالات آموزشی و معرفی بهترین مراکز کاشت و ترمیم ناخن در تبریز',
    },
  });
  console.log(`✅ Series created/updated: ${series.slug}`);

  // 2. Ensure Nail Service exists
  const nailCategory = await prisma.serviceCategory.upsert({
    where: { slug: 'nails' },
    update: {},
    create: {
      slug: 'nails',
      nameFa: 'ناخن',
    }
  });

  const nailService = await prisma.serviceDefinition.upsert({
    where: { slug: 'nail-implant' },
    update: {},
    create: {
      slug: 'nail-implant',
      nameFa: 'کاشت ناخن',
      categoryId: nailCategory.id,
      description: 'خدمات تخصصی کاشت و ترمیم ناخن',
    },
  });
  console.log(`✅ Service created/updated: ${nailService.slug}`);

  // 3. Initialize SEO for the service
  await initSeoMeta(EntityType.SERVICE, nailService.id, nailService.nameFa);
  console.log('✅ SEO Meta initialized for Nail Service');

  // 4. Attach existing "Nail" posts to this series and service
  const nailPosts = await prisma.post.findMany({
    where: {
      OR: [
        { title: { contains: 'ناخن', mode: 'insensitive' } },
        { content: { contains: 'ناخن', mode: 'insensitive' } },
      ],
      deletedAt: null,
    },
  });

  console.log(`🔍 Found ${nailPosts.length} posts related to "ناخن"`);

  for (const post of nailPosts) {
    await prisma.post.update({
      where: { id: post.id },
      data: {
        seriesId: series.id,
      },
    });

    await prisma.postService.upsert({
      where: {
        postId_serviceId: {
          postId: post.id,
          serviceId: nailService.id,
        }
      },
      update: {},
      create: {
        postId: post.id,
        serviceId: nailService.id,
      }
    });
  }

  console.log('✅ Posts updated and attached to Nail service');
  console.log('✨ Seeding completed!');
}

seed()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
