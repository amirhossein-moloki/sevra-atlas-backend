import { prisma } from '../../../shared/db/prisma';
import { TransactionClient } from '../../../shared/db/tx';
import { CommentStatus, Prisma } from '@prisma/client';

export class CommentsRepository {
  private db(tx?: TransactionClient) {
    return tx || prisma;
  }

  async findMany(params: Prisma.CommentFindManyArgs, tx?: TransactionClient) {
    const [data, total] = await Promise.all([
      this.db(tx).comment.findMany(params),
      this.db(tx).comment.count({ where: params.where }),
    ]);
    return { data, total };
  }

  async findUnique(id: bigint, tx?: TransactionClient) {
    return this.db(tx).comment.findUnique({ where: { id } });
  }

  async create(data: Prisma.CommentUncheckedCreateInput, tx?: TransactionClient) {
    return this.db(tx).comment.create({ data });
  }

  async update(id: bigint, data: Prisma.CommentUncheckedUpdateInput, tx?: TransactionClient) {
    return this.db(tx).comment.update({
      where: { id },
      data,
    });
  }

  async softDelete(id: bigint, tx?: TransactionClient) {
    return this.db(tx).comment.update({
      where: { id },
      data: {
        status: CommentStatus.removed,
        deletedAt: new Date(),
      },
    });
  }
}

export const commentsRepository = new CommentsRepository();
