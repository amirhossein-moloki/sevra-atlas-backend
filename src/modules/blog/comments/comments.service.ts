import { prisma } from '../../../shared/db/prisma';
import { CommentStatus, Prisma } from '@prisma/client';
import { ApiError } from '../../../shared/errors/ApiError';
import { safeBigInt } from '../../../shared/utils/bigint';

export class BlogCommentsService {
  async listPostComments(postSlug: string, query: Record<string, unknown>) {
    const { page = 1, pageSize = 10 } = query;
    const ordering = (query.ordering as string) || '-createdAt';
    const limit = parseInt(pageSize as string) || 10;
    const skip = (parseInt(page as string || '1') - 1) * limit;

    const where: Prisma.CommentWhereInput = {
      post: { slug: postSlug },
      status: CommentStatus.approved,
      deletedAt: null
    };

    const [comments, total] = await Promise.all([
      prisma.comment.findMany({
        where,
        include: { user: { select: { username: true, profilePicture: true } } },
        orderBy: { createdAt: (ordering as string).startsWith('-') ? 'desc' : 'asc' },
        skip,
        take: limit,
      }),
      prisma.comment.count({ where })
    ]);

    return {
      data: comments,
      meta: { page, pageSize, total, totalPages: Math.ceil(total / limit) }
    };
  }

  async createComment(postSlug: string, userId: bigint, data: Record<string, unknown>) {
    const post = await prisma.post.findUnique({ where: { slug: postSlug } });
    if (!post) throw new ApiError(404, 'Post not found');

    const comment = await prisma.comment.create({
      data: {
        postId: post.id,
        userId,
        content: data.content as string,
        parentId: data.parentId ? safeBigInt(data.parentId as string | number, 'parentId') : null,
        status: CommentStatus.pending
      }
    });

    // In a real app, trigger notification task here
    return comment;
  }

  async listGlobalComments(query: Record<string, unknown>, isAdmin: boolean) {
    const { page = 1, pageSize = 20, status } = query;
    const limit = parseInt(pageSize as string) || 20;
    const skip = (parseInt(page as string || '1') - 1) * limit;

    const where: Prisma.CommentWhereInput = { deletedAt: null };
    if (status) where.status = status as CommentStatus;
    else if (!isAdmin) where.status = CommentStatus.approved;

    const [comments, total] = await Promise.all([
      prisma.comment.findMany({
        where,
        include: {
          user: { select: { username: true, profilePicture: true } },
          post: { select: { title: true, slug: true } }
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.comment.count({ where })
    ]);

    return {
      data: comments,
      meta: { page, pageSize, total, totalPages: Math.ceil(total / limit) }
    };
  }

  async updateCommentStatus(id: bigint, status: CommentStatus) {
    const comment = await prisma.comment.update({
      where: { id },
      data: { status }
    });
    return comment;
  }

  async deleteComment(id: bigint) {
    await prisma.comment.update({
      where: { id },
      data: {
        status: CommentStatus.removed,
        deletedAt: new Date()
      }
    });
    return { ok: true };
  }
}
