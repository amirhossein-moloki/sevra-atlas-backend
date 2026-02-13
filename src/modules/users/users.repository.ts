import { prisma } from '../../shared/db/prisma';
import { TransactionClient } from '../../shared/db/tx';
import { AccountStatus, Prisma } from '@prisma/client';

export class UsersRepository {
  private db(tx?: TransactionClient) {
    return tx || prisma;
  }

  async findMany(params: Prisma.UserFindManyArgs, tx?: TransactionClient) {
    const [data, total] = await Promise.all([
      this.db(tx).user.findMany(params),
      this.db(tx).user.count({ where: params.where }),
    ]);
    return { data, total };
  }

  async findUnique(id: bigint, include?: Prisma.UserInclude, tx?: TransactionClient) {
    return (this.db(tx).user.findUnique({
      where: { id },
      include,
    }) as any);
  }

  async findFirst(where: Prisma.UserWhereInput, include?: Prisma.UserInclude, tx?: TransactionClient) {
    return (this.db(tx).user.findFirst({
      where,
      include,
    }) as any);
  }

  async create(data: Prisma.UserUncheckedCreateInput, tx?: TransactionClient) {
    return this.db(tx).user.create({ data });
  }

  async update(id: bigint, data: Prisma.UserUncheckedUpdateInput, tx?: TransactionClient) {
    return this.db(tx).user.update({
      where: { id },
      data,
    });
  }

  async softDelete(id: bigint, tx?: TransactionClient) {
    return this.db(tx).user.update({
      where: { id },
      data: {
        status: AccountStatus.DELETED,
        deletedAt: new Date(),
      },
    });
  }
}

export const usersRepository = new UsersRepository();
