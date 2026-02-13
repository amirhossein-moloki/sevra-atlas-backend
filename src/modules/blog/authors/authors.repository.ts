import { prisma } from '../../../shared/db/prisma';
import { TransactionClient } from '../../../shared/db/tx';
import { Prisma } from '@prisma/client';

export class AuthorsRepository {
  private db(tx?: TransactionClient) {
    return tx || prisma;
  }

  async findMany(params: Prisma.AuthorProfileFindManyArgs, tx?: TransactionClient) {
    return this.db(tx).authorProfile.findMany(params);
  }

  async findUnique(userId: bigint, include?: Prisma.AuthorProfileInclude, tx?: TransactionClient) {
    return (this.db(tx).authorProfile.findUnique({
      where: { userId },
      include,
    }) as any);
  }

  async create(data: Prisma.AuthorProfileUncheckedCreateInput, tx?: TransactionClient) {
    return this.db(tx).authorProfile.create({ data });
  }

  async update(userId: bigint, data: Prisma.AuthorProfileUncheckedUpdateInput, tx?: TransactionClient) {
    return this.db(tx).authorProfile.update({
      where: { userId },
      data,
    });
  }

  async delete(userId: bigint, tx?: TransactionClient) {
    return this.db(tx).authorProfile.delete({ where: { userId } });
  }
}

export const authorsRepository = new AuthorsRepository();
