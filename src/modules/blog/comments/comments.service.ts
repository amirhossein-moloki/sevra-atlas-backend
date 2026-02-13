import { CommentStatus, Prisma } from '@prisma/client';
import { ApiError } from '../../../shared/errors/ApiError';
import { commentsRepository, CommentsRepository } from './comments.repository';
import { postsRepository, PostsRepository } from '../posts/posts.repository';

export class BlogCommentsService {
  constructor(
    private readonly repo: CommentsRepository = commentsRepository,
    private readonly postsRepo: PostsRepository = postsRepository
  ) {}

  async listPostComments(postSlug: string, query: any) {
    const { page = 1, pageSize = 10, ordering = '-createdAt' } = query;
    const limit = parseInt(pageSize as string) || 10;
    const skip = (parseInt(page as string || '1') - 1) * limit;

    const where: Prisma.CommentWhereInput = {
      post: { slug: postSlug },
      status: CommentStatus.approved,
      deletedAt: null
    };

    const { data: comments, total } = await this.repo.findMany({
      where,
      include: { user: { select: { username: true, profilePicture: true } } },
      orderBy: { createdAt: ordering.startsWith('-') ? 'desc' : 'asc' },
      skip,
      take: limit,
    });

    return {
      data: comments,
      meta: { page: parseInt(page as string || '1'), pageSize: limit, total, totalPages: Math.ceil(total / limit) }
    };
  }

  async createComment(postSlug: string, userId: bigint, data: any) {
    const post = await this.postsRepo.findFirst({ slug: postSlug });
    if (!post) throw new ApiError(404, 'Post not found');

    const comment = await this.repo.create({
      postId: post.id,
      userId,
      content: data.content,
      parentId: data.parentId ? BigInt(data.parentId) : null,
      status: CommentStatus.pending
    });

    // In a real app, trigger notification task here
    return comment;
  }

  async listGlobalComments(query: any, isAdmin: boolean) {
    const { page = 1, pageSize = 20, status } = query;
    const limit = parseInt(pageSize as string) || 20;
    const skip = (parseInt(page as string || '1') - 1) * limit;

    const where: Prisma.CommentWhereInput = { deletedAt: null };
    if (status) where.status = status as CommentStatus;
    else if (!isAdmin) where.status = CommentStatus.approved;

    const { data: comments, total } = await this.repo.findMany({
      where,
      include: {
        user: { select: { username: true, profilePicture: true } },
        post: { select: { title: true, slug: true } }
      },
      orderBy: { createdAt: 'desc' },
      skip,
      take: limit,
    });

    return {
      data: comments,
      meta: { page: parseInt(page as string || '1'), pageSize: limit, total, totalPages: Math.ceil(total / limit) }
    };
  }

  async updateCommentStatus(id: bigint, status: CommentStatus) {
    const comment = await this.repo.update(id, { status });
    return comment;
  }

  async deleteComment(id: bigint) {
    await this.repo.softDelete(id);
    return { ok: true };
  }
}
