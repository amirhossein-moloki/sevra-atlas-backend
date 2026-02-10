import { PrismaClient, UserRole } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding data...');

  // 1. Admin User
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

  // 2. Author User
  const author = await prisma.user.upsert({
    where: { username: 'author' },
    update: {},
    create: {
      username: 'author',
      firstName: 'Author',
      lastName: 'One',
      email: 'author@sevra.ir',
      phoneNumber: '+989120000002',
      isStaff: true,
      isActive: true,
      isPhoneVerified: true,
      role: UserRole.AUTHOR,
      referralCode: 'AUTH01',
    },
  });

  // 3. Author Profile
  await prisma.authorProfile.upsert({
    where: { userId: author.id },
    update: {},
    create: {
      userId: author.id,
      displayName: 'Author One',
      bio: 'Professional beauty editor and researcher.',
    },
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
