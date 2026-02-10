import { prisma } from '../../../shared/db/prisma';
import { ApiError } from '../../../shared/errors/ApiError';
import { PostStatus, PostVisibility, UserRole, EntityType } from '@prisma/client';

export class PostsService {
  async listPosts(query: any, user?: any) {
    const {
      page = 1, pageSize = 10, search, ordering,
      published_after, published_before, category, tags,
      is_hot, series, visibility
    } = query;
    
    const limit = Math.min(parseInt(pageSize as string) || 10, 100);
    const skip = (parseInt(page as string || '1') - 1) * limit;

    const where: any = {};

    // Permission-based queryset
    if (!user || user.role === UserRole.USER) {
      // Anonymous or normal user: only published posts
      where.status = PostStatus.published;
      where.publishedAt = { lte: new Date() };
    } else if (user.role === UserRole.ADMIN || user.role === UserRole.MODERATOR) {
      // Staff: all posts
    } else if (user.role === UserRole.AUTHOR) {
      // Author: published or own posts
      where.OR = [
        { status: PostStatus.published, publishedAt: { lte: new Date() } },
        { authorId: user.id }
      ];
    }

    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { content: { contains: search, mode: 'insensitive' } },
        { excerpt: { contains: search, mode: 'insensitive' } },
      ];
    }

    if (published_after) where.publishedAt = { ...where.publishedAt, gte: new Date(published_after) };
    if (published_before) where.publishedAt = { ...where.publishedAt, lte: new Date(published_before) };
    if (category) where.category = { slug: category };
    if (tags) {
      const tagSlugs = Array.isArray(tags) ? tags : (tags as string).split(',');
      where.tags = { every: { tag: { slug: { in: tagSlugs } } } };
    }
    if (is_hot === 'true') where.isHot = true;
    if (series) where.series = { slug: series };
    if (visibility) where.visibility = visibility as PostVisibility;

    let orderBy: any = { publishedAt: 'desc' };
    if (ordering) {
      const field = ordering.startsWith('-') ? ordering.substring(1) : ordering;
      const direction = ordering.startsWith('-') ? 'desc' : 'asc';
      orderBy = { [field]: direction };
    }

    const [posts, total] = await Promise.all([
      prisma.post.findMany({
        where,
        orderBy: [orderBy, { id: 'desc' }],
        skip,
        take: limit,
        include: {
          author: { include: { user: { select: { firstName: true, lastName: true, profilePicture: true } } } },
          category: true,
          coverMedia: true,
          tags: { include: { tag: true } },
          _count: { select: { comments: { where: { status: 'approved' } } } }
        }
      }),
      prisma.post.count({ where })
    ]);

    return {
      data: posts.map(p => this.serializePost(p)),
      meta: { page: parseInt(page), pageSize: limit, total, totalPages: Math.ceil(total / limit) }
    };
  }

  async getPostBySlug(slug: string, user?: any) {
    const post = await prisma.post.findUnique({
      where: { slug },
      include: {
        author: { include: { user: { select: { firstName: true, lastName: true, profilePicture: true } } } },
        category: true,
        coverMedia: true,
        ogImage: true,
        tags: { include: { tag: true } },
        series: true,
        mediaAttachments: { include: { media: true } }
      }
    });

    if (!post) throw new ApiError(404, 'Post not found');

    // Visibility check
    if (post.status !== PostStatus.published || (post.publishedAt && post.publishedAt > new Date())) {
      const canView = user && (user.role === UserRole.ADMIN || user.id === post.authorId);
      if (!canView) throw new ApiError(404, 'Post not found');
    }

    // Increment views
    await prisma.post.update({
      where: { id: post.id },
      data: { viewsCount: { increment: 1 } }
    });

    return this.serializePost(post);
  }

  async createPost(data: any, authorUserId: bigint) {
    const authorProfile = await prisma.authorProfile.findUnique({ where: { userId: authorUserId } });
    if (!authorProfile) throw new ApiError(403, 'User does not have an author profile');

    const { tag_ids, ...postData } = data;

    // Handle publication date logic
    const publication = this.handlePublicationDate(data.status, data.publish_at);

    return prisma.$transaction(async (tx) => {
      const post = await tx.post.create({
        data: {
          ...postData,
          ...publication,
          authorId: authorUserId,
          categoryId: data.category_id ? BigInt(data.category_id) : undefined,
          seriesId: data.series_id ? BigInt(data.series_id) : undefined,
          coverMediaId: data.cover_media_id ? BigInt(data.cover_media_id) : undefined,
          ogImageId: data.og_image_id ? BigInt(data.og_image_id) : undefined,
          tags: tag_ids ? {
            create: tag_ids.map((id: number) => ({ tagId: BigInt(id) }))
          } : undefined
        }
      });

      return this.serializePost(post);
    });
  }

  async updatePost(slug: string, data: any, user: any) {
    const post = await prisma.post.findUnique({ where: { slug } });
    if (!post) throw new ApiError(404, 'Post not found');

    if (user.role !== UserRole.ADMIN && post.authorId !== user.id) {
      throw new ApiError(403, 'Forbidden');
    }

    const { tag_ids, ...postData } = data;
    const publication = this.handlePublicationDate(data.status || post.status, data.publish_at);

    return prisma.$transaction(async (tx) => {
      const updatedPost = await tx.post.update({
        where: { id: post.id },
        data: {
          ...postData,
          ...publication,
          categoryId: data.category_id ? BigInt(data.category_id) : undefined,
          seriesId: data.series_id ? BigInt(data.series_id) : undefined,
          coverMediaId: data.cover_media_id ? BigInt(data.cover_media_id) : undefined,
          ogImageId: data.og_image_id ? BigInt(data.og_image_id) : undefined,
          tags: tag_ids ? {
            deleteMany: {},
            create: tag_ids.map((id: number) => ({ tagId: BigInt(id) }))
          } : undefined
        }
      });

      return this.serializePost(updatedPost);
    });
  }

  async deletePost(slug: string, user: any) {
    const post = await prisma.post.findUnique({ where: { slug } });
    if (!post) throw new ApiError(404, 'Post not found');

    if (user.role !== UserRole.ADMIN && post.authorId !== user.id) {
      throw new ApiError(403, 'Forbidden');
    }

    await prisma.post.delete({ where: { id: post.id } });
    return { ok: true };
  }

  async getSimilarPosts(slug: string) {
    const post = await prisma.post.findUnique({ where: { slug } });
    if (!post) throw new ApiError(404, 'Post not found');
    if (!post.categoryId) return { data: [] };

    const similar = await prisma.post.findMany({
      where: {
        categoryId: post.categoryId,
        status: PostStatus.published,
        publishedAt: { lte: new Date() },
        id: { not: post.id }
      },
      orderBy: { publishedAt: 'desc' },
      take: 5,
      include: {
        author: { include: { user: { select: { firstName: true, lastName: true, profilePicture: true } } } },
        category: true,
        coverMedia: true
      }
    });

    return { data: similar.map(p => this.serializePost(p)) };
  }

  async getSameCategoryPosts(slug: string, query: any) {
    const post = await prisma.post.findUnique({ where: { slug } });
    if (!post) throw new ApiError(404, 'Post not found');
    if (!post.categoryId) return { data: [], meta: { total: 0 } };

    const { page = 1, pageSize = 10 } = query;
    const limit = parseInt(pageSize as string) || 10;
    const skip = (parseInt(page as string || '1') - 1) * limit;

    const where = {
      categoryId: post.categoryId,
      status: PostStatus.published,
      publishedAt: { lte: new Date() },
      id: { not: post.id }
    };

    const [data, total] = await Promise.all([
      prisma.post.findMany({
        where,
        orderBy: { publishedAt: 'desc' },
        skip,
        take: limit,
        include: {
          author: { include: { user: { select: { firstName: true, lastName: true, profilePicture: true } } } },
          category: true,
          coverMedia: true
        }
      }),
      prisma.post.count({ where })
    ]);

    return {
      data: data.map(p => this.serializePost(p)),
      meta: { page, pageSize: limit, total, totalPages: Math.ceil(total / limit) }
    };
  }

  async getRelatedPosts(slug: string) {
    const post = await prisma.post.findUnique({
      where: { slug },
      include: { tags: true }
    });
    if (!post) throw new ApiError(404, 'Post not found');

    const tagIds = post.tags.map(t => t.tagId);
    if (tagIds.length === 0) return { data: [] };

    // In Prisma we can't easily do the "count common tags" annotation in a single findMany
    // without raw query or multiple steps. For simplicity:
    const related = await prisma.post.findMany({
      where: {
        status: PostStatus.published,
        publishedAt: { lte: new Date() },
        id: { not: post.id },
        tags: { some: { tagId: { in: tagIds } } }
      },
      take: 10,
      include: {
        author: { include: { user: { select: { firstName: true, lastName: true, profilePicture: true } } } },
        category: true,
        coverMedia: true,
        tags: true
      }
    });

    // Sort by common tags manually
    related.sort((a, b) => {
      const aCommon = a.tags.filter(t => tagIds.includes(t.tagId)).length;
      const bCommon = b.tags.filter(t => tagIds.includes(t.tagId)).length;
      return bCommon - aCommon || (b.publishedAt?.getTime() || 0) - (a.publishedAt?.getTime() || 0);
    });

    return { data: related.map(p => this.serializePost(p)).slice(0, 5) };
  }

  async publishPost(slug: string, user: any) {
    const post = await prisma.post.findUnique({ where: { slug } });
    if (!post) throw new ApiError(404, 'Post not found');

    if (user.role !== UserRole.ADMIN && post.authorId !== user.id) {
      throw new ApiError(403, 'Forbidden');
    }

    if (post.status !== PostStatus.draft && post.status !== PostStatus.scheduled) {
      throw new ApiError(400, 'Only drafts or scheduled posts can be published');
    }

    const updated = await prisma.post.update({
      where: { id: post.id },
      data: {
        status: PostStatus.published,
        publishedAt: new Date(),
        scheduledAt: null
      }
    });

    return this.serializePost(updated);
  }

  private handlePublicationDate(status: PostStatus, publishAt?: string) {
    if (!publishAt) return { status };

    const date = new Date(publishAt);
    const now = new Date();

    if (date > now) {
      return { status: PostStatus.scheduled, scheduledAt: date, publishedAt: date };
    } else {
      return { status: PostStatus.published, publishedAt: date, scheduledAt: null };
    }
  }

  private serializePost(post: any) {
    if (!post) return null;
    const res = { ...post };
    if (res.id) res.id = res.id.toString();
    if (res.authorId) res.authorId = res.authorId.toString();
    if (res.categoryId) res.categoryId = res.categoryId.toString();
    if (res.seriesId) res.seriesId = res.seriesId.toString();
    if (res.coverMediaId) res.coverMediaId = res.coverMediaId.toString();
    if (res.ogImageId) res.ogImageId = res.ogImageId.toString();

    if (res.author && res.author.userId) {
      res.author.userId = res.author.userId.toString();
      if (res.author.avatarId) res.author.avatarId = res.author.avatarId.toString();
    }

    if (res.tags) {
      res.tags = res.tags.map((t: any) => t.tag || t);
    }

    if (res.mediaAttachments) {
      res.mediaAttachments = res.mediaAttachments.map((m: any) => ({
        ...m,
        id: m.id.toString(),
        postId: m.postId.toString(),
        mediaId: m.mediaId.toString(),
      }));
    }

    return res;
  }
}
