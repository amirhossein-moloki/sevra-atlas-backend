import { prisma } from '../../../shared/db/prisma';
import { ApiError } from '../../../shared/errors/ApiError';
import { handleSlugChange } from '../../../shared/utils/seo';
import { EntityType, PostStatus } from '@prisma/client';

export class PostsService {
  async getPosts(filters: any) {
    const { category, tag, q, page = 1, limit = 10 } = filters;
    
    const where: any = {
      status: PostStatus.published,
      publishedAt: { lte: new Date() },
    };

    if (category) where.category = { slug: category };
    if (tag) where.tags = { some: { tag: { slug: tag } } };
    if (q) {
      where.OR = [
        { title: { contains: q, mode: 'insensitive' } },
        { content: { contains: q, mode: 'insensitive' } },
      ];
    }

    const [data, total] = await Promise.all([
      prisma.post.findMany({
        where,
        orderBy: { publishedAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
        include: { author: true, category: true, tags: { include: { tag: true } } },
      }),
      prisma.post.count({ where }),
    ]);

    return { data, total };
  }

  async getPostBySlug(slug: string) {
    const post = await prisma.post.findUnique({
      where: { slug },
      include: {
        author: true,
        category: true,
        tags: { include: { tag: true } },
        comments: { where: { status: 'approved' } },
      },
    });

    if (!post) throw new ApiError(404, 'Post not found');

    // Increment views
    await prisma.post.update({
      where: { id: post.id },
      data: { viewsCount: { increment: 1 } },
    });

    return post;
  }

  async createPost(data: any, userId: bigint) {
    // Check if user has author profile
    const author = await prisma.authorProfile.findUnique({ where: { userId } });
    if (!author) throw new ApiError(403, 'User is not an author');

    return prisma.post.create({
      data: {
        ...data,
        authorId: userId,
        categoryId: data.categoryId ? BigInt(data.categoryId) : undefined,
        publishedAt: data.status === 'published' ? new Date() : undefined,
      },
    });
  }

  async updatePost(id: bigint, data: any, userId: bigint, isAdmin: boolean) {
    const post = await prisma.post.findUnique({ where: { id } });
    if (!post) throw new ApiError(404, 'Post not found');

    if (!isAdmin && post.authorId !== userId) {
      throw new ApiError(403, 'Forbidden');
    }

    if (data.slug && data.slug !== post.slug) {
      await handleSlugChange(EntityType.BLOG_POST, id, post.slug, data.slug, '/blog');
    }

    return prisma.post.update({
      where: { id },
      data: {
        ...data,
        categoryId: data.categoryId ? BigInt(data.categoryId) : undefined,
      },
    });
  }

  async publishPost(id: bigint) {
    return prisma.post.update({
      where: { id },
      data: {
        status: PostStatus.published,
        publishedAt: new Date(),
        scheduledAt: null,
      },
    });
  }
}
