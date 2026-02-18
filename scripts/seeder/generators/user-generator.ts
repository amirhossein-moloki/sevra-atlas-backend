import { PrismaClient, UserRole, AccountStatus } from '@prisma/client';
import { BaseGenerator, getRandom } from './base';
import { PERSIAN_FIRST_NAMES, PERSIAN_LAST_NAMES } from '../data/source';
import { UserSchema, validate } from '../utils/validation';
import * as bcrypt from 'bcrypt';

export class UserGenerator extends BaseGenerator {
  async seed(count: number): Promise<void> {
    this.log(`Seeding ${count} users...`);
    const password = await bcrypt.hash('User@123', 10);

    for (let i = 0; i < count; i++) {
      const firstName = getRandom(PERSIAN_FIRST_NAMES);
      const lastName = getRandom(PERSIAN_LAST_NAMES);
      const username = `user_${i}_${Math.random().toString(36).substring(7)}`;
      const email = `${username}@example.com`;
      const phoneNumber = `+989${(100000000 + i).toString()}`;

      const userData = {
        username,
        email,
        firstName,
        lastName,
        phoneNumber,
        password,
        role: UserRole.USER,
        status: AccountStatus.ACTIVE,
        isActive: true,
        isStaff: false,
        referralCode: `REF_${i}_${Math.random().toString(36).substring(2, 6).toUpperCase()}`,
      };

      validate(UserSchema, userData);

      await this.prisma.user.upsert({
        where: { phoneNumber: userData.phoneNumber },
        update: {},
        create: userData,
      });
    }
  }

  async createSpecialUsers(): Promise<void> {
    this.log('Creating Admin and Author users...');
    const password = await bcrypt.hash('Admin@123', 10);

    const users = [
      {
        username: 'admin_root',
        email: 'admin@sevra.ir',
        firstName: 'مدیر',
        lastName: 'کل',
        phoneNumber: '+989000000000',
        password,
        role: UserRole.ADMIN,
        isStaff: true,
        isActive: true,
        referralCode: 'ADMIN_ROOT',
      },
      {
        username: 'editor_primary',
        email: 'editor@sevra.ir',
        firstName: 'سردبیر',
        lastName: 'اصلی',
        phoneNumber: '+989000000001',
        password,
        role: UserRole.AUTHOR,
        isStaff: true,
        isActive: true,
        referralCode: 'EDITOR_PRIMARY',
      }
    ];

    for (const u of users) {
      const data = { ...u, status: AccountStatus.ACTIVE };
      validate(UserSchema, data);
      await this.prisma.user.upsert({
        where: { phoneNumber: u.phoneNumber },
        update: {},
        create: data,
      });
    }
  }
}
