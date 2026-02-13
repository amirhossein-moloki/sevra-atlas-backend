import { prisma } from '../../../shared/db/prisma';
import { TransactionClient } from '../../../shared/db/tx';
import { PostStatus, Prisma } from '@prisma/client';
import { PostQueryFragments } from '../../../shared/db/queryFragments';

export class PostsRepository {
  private db(tx?: TransactionClient) {
    return tx || prisma;
  }

  async findMany(params: Prisma.PostFindManyArgs, tx?: TransactionClient) {
    const [data, total] = await Promise.all([
      this.db(tx).post.findMany({
        ...params,
        include: params.include || PostQueryFragments.LIST_INCLUDE,
      }),
      this.db(tx).post.count({ where: params.where }),
    ]);
    return { data, total };
  }

  async findUnique(id: bigint, include?: Prisma.PostInclude, tx?: TransactionClient) {
    return (this.db(tx).post.findUnique({
      where: { id },
      include: include || PostQueryFragments.DETAIL_INCLUDE,
    }) as any);
  }

  async findFirst(where: Prisma.PostWhereInput, include?: Prisma.PostInclude, tx?: TransactionClient) {
    return (this.db(tx).post.findFirst({
      where,
      include: include || PostQueryFragments.DETAIL_INCLUDE,
    }) as any);
  }

  async create(data: Prisma.PostUncheckedCreateInput, tx?: TransactionClient) {
    return this.db(tx).post.create({ data });
  }

  async update(id: bigint, data: Prisma.PostUncheckedUpdateInput, tx?: TransactionClient) {
    return this.db(tx).post.update({
      where: { id },
      data,
    });
  }

  async softDelete(id: bigint, tx?: TransactionClient) {
    return this.db(tx).post.update({
      where: { id },
      data: {
        status: PostStatus.archived,
        deletedAt: new Date()
      },
    });
  }

  async incrementViews(id: bigint, tx?: TransactionClient) {
    return this.db(tx).post.update({
      where: { id },
      data: { viewsCount: { increment: 1 } }
    });
  }
}

export const postsRepository = new PostsRepository();
