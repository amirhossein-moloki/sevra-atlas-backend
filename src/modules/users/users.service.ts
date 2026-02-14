import { prisma } from '../../shared/db/prisma';
import { ApiError } from '../../shared/errors/ApiError';
import { UserRole, AccountStatus } from '@prisma/client';

export class UsersService {
  private readonly publicUserFields = {
    id: true,
    username: true,
    firstName: true,
    lastName: true,
    phoneNumber: true,
    role: true,
    status: true,
    gender: true,
    bio: true,
    cityId: true,
    createdAt: true,
    updatedAt: true,
  };

  async getUserById(id: string) {
    const user = await prisma.user.findFirst({
      where: { id: BigInt(id), deletedAt: null },
      select: this.publicUserFields,
    });
    if (!user) throw new ApiError(404, 'User not found');
    return user;
  }

  async updateUser(id: string, data: any) {
    const user = await prisma.user.update({
      where: { id: BigInt(id) },
      data: {
        firstName: data.firstName,
        lastName: data.lastName,
        bio: data.bio,
        cityId: data.cityId ? BigInt(data.cityId) : undefined,
        gender: data.gender,
      },
    });
    return user;
  }

  async listUsers(query: any) {
    const { q, role, status, page = 1, pageSize = 20 } = query;
    const skip = (page - 1) * pageSize;

    const where: any = { deletedAt: null };
    if (q) {
      where.OR = [
        { username: { contains: q, mode: 'insensitive' } },
        { phoneNumber: { contains: q } },
      ];
    }
    if (role) where.role = role;
    if (status) where.status = status;

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        select: this.publicUserFields,
        skip,
        take: pageSize,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.user.count({ where }),
    ]);

    return {
      data: users,
      meta: {
        page,
        pageSize,
        total,
        totalPages: Math.ceil(total / pageSize),
      },
    };
  }

  async updateUserRole(id: string, role: UserRole) {
    await prisma.user.update({
      where: { id: BigInt(id) },
      data: { role },
    });
    return { ok: true };
  }

  async updateUserStatus(id: string, status: AccountStatus) {
    await prisma.user.update({
      where: { id: BigInt(id) },
      data: { status },
    });
    return { ok: true };
  }

  async deleteUser(id: string) {
    await prisma.user.update({
      where: { id: BigInt(id) },
      data: {
        status: AccountStatus.DELETED,
        deletedAt: new Date(),
      },
    });
    return { ok: true };
  }

}
