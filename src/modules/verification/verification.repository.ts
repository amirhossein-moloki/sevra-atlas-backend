import { prisma } from '../../shared/db/prisma';
import { TransactionClient } from '../../shared/db/tx';
import { Prisma } from '@prisma/client';

export class VerificationRepository {
  private db(tx?: TransactionClient) {
    return tx || prisma;
  }

  async findMany(params: Prisma.VerificationRequestFindManyArgs, tx?: TransactionClient) {
    const [data, total] = await Promise.all([
      this.db(tx).verificationRequest.findMany(params),
      this.db(tx).verificationRequest.count({ where: params.where }),
    ]);
    return { data, total };
  }

  async findUnique(id: bigint, tx?: TransactionClient) {
    return this.db(tx).verificationRequest.findUnique({ where: { id } });
  }

  async findFirst(where: Prisma.VerificationRequestWhereInput, tx?: TransactionClient) {
    return this.db(tx).verificationRequest.findFirst({ where });
  }

  async create(data: Prisma.VerificationRequestUncheckedCreateInput, tx?: TransactionClient) {
    return this.db(tx).verificationRequest.create({ data });
  }

  async update(id: bigint, data: Prisma.VerificationRequestUncheckedUpdateInput, tx?: TransactionClient) {
    return this.db(tx).verificationRequest.update({ where: { id }, data });
  }
}

export const verificationRepository = new VerificationRepository();
