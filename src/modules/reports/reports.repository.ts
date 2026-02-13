import { prisma } from '../../shared/db/prisma';
import { TransactionClient } from '../../shared/db/tx';
import { Prisma } from '@prisma/client';

export class ReportsRepository {
  private db(tx?: TransactionClient) {
    return tx || prisma;
  }

  async findMany(params: Prisma.ReportFindManyArgs, tx?: TransactionClient) {
    const [data, total] = await Promise.all([
      this.db(tx).report.findMany(params),
      this.db(tx).report.count({ where: params.where }),
    ]);
    return { data, total };
  }

  async create(data: Prisma.ReportUncheckedCreateInput, tx?: TransactionClient) {
    return this.db(tx).report.create({ data });
  }

  async update(id: bigint, data: Prisma.ReportUncheckedUpdateInput, tx?: TransactionClient) {
    return this.db(tx).report.update({ where: { id }, data });
  }
}

export const reportsRepository = new ReportsRepository();
