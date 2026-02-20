import { prisma } from '../src/shared/db/prisma';
import bcrypt from 'bcrypt';
import { UserRole } from '@prisma/client';
import { config } from '../src/config';

async function main() {
  const args = process.argv.slice(2);
  const getArg = (name: string) => {
    const idx = args.indexOf(`--${name}`);
    if (idx !== -1 && args[idx + 1]) return args[idx + 1];
    return null;
  };

  const identifier = getArg('identifier');
  const password = getArg('password');
  const firstName = getArg('firstName') || 'Admin';
  const lastName = getArg('lastName') || 'User';
  const roleArg = getArg('role') || 'ADMIN';

  if (!identifier || !password) {
    console.log('Usage: ts-node scripts/admin-create.ts --identifier <email/username/phone> --password <pass> [--firstName <name>] [--lastName <name>] [--role <ADMIN/SUPER_ADMIN>]');
    process.exit(1);
  }

  const role = (roleArg.toUpperCase() === 'SUPER_ADMIN') ? UserRole.SUPER_ADMIN : UserRole.ADMIN;

  console.log(`🚀 Creating/Promoting user: ${identifier} with role ${role}...`);

  const hashedPassword = await bcrypt.hash(password, config.security.bcryptRounds);

  try {
    // Try to find by email, username or phone
    const existingUser = await prisma.user.findFirst({
      where: {
        OR: [
          { email: identifier },
          { username: identifier },
          { phoneNumber: identifier },
        ],
      },
    });

    if (existingUser) {
      console.log(`Found existing user with ID: ${existingUser.id}. Promoting to ${role}...`);
      const updatedUser = await prisma.user.update({
        where: { id: existingUser.id },
        data: {
          role,
          password: hashedPassword,
          isActive: true,
        },
      });
      console.log(`✅ User ${updatedUser.username} promoted successfully.`);
    } else {
      console.log(`User not found. Creating new ${role}...`);
      // For a new user, we need to provide all required fields.
      // Assuming identifier could be any of the three, we'll try to guess or use as both.
      let email = identifier.includes('@') ? identifier : `${identifier}@admin.local`;
      let username = identifier.includes('@') ? identifier.split('@')[0] : identifier;
      let phoneNumber = identifier.match(/^\d+$/) ? identifier : `09000000000`; // Placeholder if not provided

      const newUser = await prisma.user.create({
        data: {
          email,
          username,
          phoneNumber,
          password: hashedPassword,
          firstName,
          lastName,
          role,
          isStaff: true,
          isActive: true,
          isPhoneVerified: true,
          referralCode: Math.random().toString(36).substring(2, 10),
        },
      });
      console.log(`✅ New user created with ID: ${newUser.id}`);
    }
  } catch (error: any) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();
