import { prisma } from '../../shared/db/prisma';
import { ApiError } from '../../shared/errors/ApiError';
import { UserRole, AccountStatus } from '@prisma/client';
import { serialize } from '../../shared/utils/serialize';

export class UsersService {
  async getUserById(id: string) {
    const user = await prisma.user.findFirst({
      where: { id: BigInt(id), deletedAt: null },
    });
    if (!user) throw new ApiError(404, 'User not found');
    return serialize(user);
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
    return serialize(user);
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
        skip,
        take: pageSize,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.user.count({ where }),
    ]);

    return {
      data: users.map(u => serialize(u)),
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
