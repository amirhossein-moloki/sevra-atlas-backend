import { prisma } from '../../shared/db/prisma';
import { ApiError } from '../../shared/errors/ApiError';
import { UserRole, AccountStatus, Prisma, Gender } from '@prisma/client';

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

  async updateUser(id: string, data: Record<string, unknown>) {
    const user = await prisma.user.update({
      where: { id: BigInt(id) },
      data: {
        firstName: data.firstName as string | undefined,
        lastName: data.lastName as string | undefined,
        bio: data.bio as string | undefined,
        cityId: data.cityId ? BigInt(data.cityId as string | number | bigint) : undefined,
        gender: data.gender as Gender | undefined,
      },
    });
    return user;
  }

  async listUsers(query: Record<string, unknown>) {
    const page = Number(query.page || 1);
    const pageSize = Number(query.pageSize || 20);
    const { q, role, status } = query;
    const skip = (page - 1) * pageSize;

    const where: Prisma.UserWhereInput = { deletedAt: null };
    if (q) {
      where.OR = [
        { username: { contains: q as string, mode: 'insensitive' } },
        { phoneNumber: { contains: q as string } },
      ];
    }
    if (role) where.role = role as UserRole;
    if (status) where.status = status as AccountStatus;

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
