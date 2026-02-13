import { ApiError } from '../../shared/errors/ApiError';
import { UserRole, AccountStatus, Prisma } from '@prisma/client';
import { usersRepository, UsersRepository } from './users.repository';

export class UsersService {
  constructor(
    private readonly repo: UsersRepository = usersRepository
  ) {}

  async getUserById(id: string) {
    const user = await this.repo.findFirst({ id: BigInt(id), deletedAt: null });
    if (!user) throw new ApiError(404, 'User not found');
    return user;
  }

  async updateUser(id: string, data: any) {
    const user = await this.repo.update(BigInt(id), {
      firstName: data.firstName,
      lastName: data.lastName,
      bio: data.bio,
      cityId: data.cityId ? BigInt(data.cityId) : undefined,
      gender: data.gender,
    });
    return user;
  }

  async listUsers(query: any) {
    const { q, role, status, page = 1, pageSize = 20 } = query;
    const limit = parseInt(pageSize as string) || 20;
    const skip = (parseInt(page as string || '1') - 1) * limit;

    const where: Prisma.UserWhereInput = { deletedAt: null };
    if (q) {
      where.OR = [
        { username: { contains: q as string, mode: 'insensitive' as const } },
        { phoneNumber: { contains: q as string } },
      ];
    }
    if (role) where.role = role as UserRole;
    if (status) where.status = status as AccountStatus;

    const { data: users, total } = await this.repo.findMany({
      where,
      skip,
      take: limit,
      orderBy: { createdAt: 'desc' },
    });

    return {
      data: users,
      meta: {
        page: parseInt(page as string || '1'),
        pageSize: limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async updateUserRole(id: string, role: UserRole) {
    await this.repo.update(BigInt(id), { role });
    return { ok: true };
  }

  async updateUserStatus(id: string, status: AccountStatus) {
    await this.repo.update(BigInt(id), { status });
    return { ok: true };
  }

  async deleteUser(id: string) {
    await this.repo.softDelete(BigInt(id));
    return { ok: true };
  }

}
