import { prisma } from '../../../shared/db/prisma';
import { CommentStatus, UserRole } from '@prisma/client';
import { ApiError } from '../../../shared/errors/ApiError';

export class BlogCommentsService {
  async listPostComments(postSlug: string, query: any) {
    const { page = 1, pageSize = 10, ordering = '-createdAt' } = query;
    const limit = parseInt(pageSize as string) || 10;
    const skip = (parseInt(page as string || '1') - 1) * limit;

    const where: any = {
      post: { slug: postSlug },
      status: CommentStatus.approved
    };

    const [comments, total] = await Promise.all([
      prisma.comment.findMany({
        where,
        include: { user: { select: { username: true, profilePicture: true } } },
        orderBy: { createdAt: ordering.startsWith('-') ? 'desc' : 'asc' },
        skip,
        take: limit,
      }),
      prisma.comment.count({ where })
    ]);

    return {
      data: comments.map(c => this.serialize(c)),
      meta: { page, pageSize, total, totalPages: Math.ceil(total / limit) }
    };
  }

  async createComment(postSlug: string, userId: bigint, data: any) {
    const post = await prisma.post.findUnique({ where: { slug: postSlug } });
    if (!post) throw new ApiError(404, 'Post not found');

    const comment = await prisma.comment.create({
      data: {
        postId: post.id,
        userId,
        content: data.content,
        parentId: data.parentId ? BigInt(data.parentId) : null,
        status: CommentStatus.pending
      }
    });

    // In a real app, trigger notification task here
    return this.serialize(comment);
  }

  async listGlobalComments(query: any, isAdmin: boolean) {
    const { page = 1, pageSize = 20, status } = query;
    const limit = parseInt(pageSize as string) || 20;
    const skip = (parseInt(page as string || '1') - 1) * limit;

    const where: any = {};
    if (status) where.status = status;
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
      data: comments.map(c => this.serialize(c)),
      meta: { page, pageSize, total, totalPages: Math.ceil(total / limit) }
    };
  }

  async updateCommentStatus(id: bigint, status: CommentStatus) {
    const comment = await prisma.comment.update({
      where: { id },
      data: { status }
    });
    return this.serialize(comment);
  }

  async deleteComment(id: bigint) {
    await prisma.comment.delete({ where: { id } });
    return { ok: true };
  }

  private serialize(obj: any): any {
    if (!obj) return null;
    if (Array.isArray(obj)) return obj.map(o => this.serialize(o));
    const res = { ...obj };
    for (const key in res) {
      if (typeof res[key] === 'bigint') res[key] = res[key].toString();
      else if (typeof res[key] === 'object' && res[key] !== null && !(res[key] instanceof Date)) res[key] = this.serialize(res[key]);
    }
    return res;
  }
}
