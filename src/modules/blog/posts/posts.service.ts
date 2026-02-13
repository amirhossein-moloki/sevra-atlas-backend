import { ApiError } from '../../../shared/errors/ApiError';
import { PostStatus, PostVisibility, UserRole, EntityType, Prisma } from '@prisma/client';
import { handleSlugChange, initSeoMeta } from '../../../shared/utils/seo';
import { isStaff, isAdmin } from '../../../shared/auth/roles';
import { withTx } from '../../../shared/db/tx';
import { postsRepository, PostsRepository } from './posts.repository';
import { authorsRepository, AuthorsRepository } from '../authors/authors.repository';

export class PostsService {
  constructor(
    private readonly repo: PostsRepository = postsRepository,
    private readonly authorsRepo: AuthorsRepository = authorsRepository
  ) {}

  async listPosts(query: any, user?: any) {
    const {
      page = 1, pageSize = 10, q, ordering,
      published_after, published_before, category, tag, author,
      is_hot, series, visibility
    } = query;
    
    const limit = Math.min(parseInt(pageSize as string) || 10, 100);
    const skip = (parseInt(page as string || '1') - 1) * limit;

    const where: Prisma.PostWhereInput = { deletedAt: null };

    // Permission-based queryset
    if (!user || user.role === UserRole.USER) {
      // Anonymous or normal user: only published posts
      where.status = PostStatus.published;
      where.publishedAt = { lte: new Date() };
    } else if (isStaff(user.role)) {
      // Staff: all posts
    } else if (user.role === UserRole.AUTHOR) {
      // Author: published or own posts
      where.OR = [
        { status: PostStatus.published, publishedAt: { lte: new Date() } },
        { authorId: user.id }
      ];
    }

    if (q) {
      const qOR = [
        { title: { contains: q as string, mode: 'insensitive' as const } },
        { content: { contains: q as string, mode: 'insensitive' as const } },
        { excerpt: { contains: q as string, mode: 'insensitive' as const } },
      ];
      if (where.OR) {
        where.AND = [{ OR: where.OR }, { OR: qOR }];
        delete where.OR;
      } else {
        where.OR = qOR;
      }
    }

    if (published_after) where.publishedAt = { ...((where.publishedAt as any) || {}), gte: new Date(published_after) };
    if (published_before) where.publishedAt = { ...((where.publishedAt as any) || {}), lte: new Date(published_before) };
    if (category) where.category = { slug: category };
    if (tag) {
      const tagSlugs = Array.isArray(tag) ? tag : (tag as string).split(',');
      where.tags = { some: { tag: { slug: { in: tagSlugs } } } };
    }
    if (is_hot === 'true') where.isHot = true;
    if (series) where.series = { slug: series };
    if (visibility) where.visibility = visibility as PostVisibility;
    if (author) {
      if (!isNaN(Number(author))) {
        where.authorId = BigInt(author);
      } else {
        where.author = { user: { username: author } };
      }
    }

    let orderBy: any = { publishedAt: 'desc' };
    if (ordering) {
      const direction = ordering.startsWith('-') ? 'desc' : 'asc';
      const field = ordering.startsWith('-') ? ordering.substring(1) : ordering;

      if (field === 'comments_count') {
        orderBy = { comments: { _count: direction } };
      } else {
        orderBy = { [field]: direction };
      }
    }

    const { data: posts, total } = await this.repo.findMany({
      where,
      orderBy: [orderBy, { id: 'desc' }],
      skip,
      take: limit,
    });

    return {
      data: posts,
      meta: { page: parseInt(page), pageSize: limit, total, totalPages: Math.ceil(total / limit) }
    };
  }

  async getPostBySlug(slug: string, user?: any) {
    const post = await this.repo.findFirst({ slug, deletedAt: null });

    if (!post) throw new ApiError(404, 'Post not found');

    // Visibility check
    if (post.status !== PostStatus.published || (post.publishedAt && post.publishedAt > new Date())) {
      const canView = user && (isAdmin(user.role) || user.id === post.authorId);
      if (!canView) throw new ApiError(404, 'Post not found');
    }

    // Increment views
    await this.repo.incrementViews(post.id);

    return post;
  }

  async createPost(data: any, authorUserId: bigint) {
    const authorProfile = await this.authorsRepo.findUnique(authorUserId);
    if (!authorProfile) throw new ApiError(403, 'User does not have an author profile');

    const { tag_ids, ...postData } = data;

    // Handle publication date logic
    const publication = this.handlePublicationDate(data.status, data.publish_at);

    return withTx(async (tx) => {
      const post = await this.repo.create({
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
      }, tx);

      await initSeoMeta(EntityType.BLOG_POST, post.id, post.title, tx);

      return post;
    });
  }

  async updatePost(slug: string, data: any, user: any) {
    const post = await this.repo.findFirst({ slug });
    if (!post) throw new ApiError(404, 'Post not found');

    if (!isStaff(user.role) && post.authorId !== user.id) {
      throw new ApiError(403, 'Forbidden');
    }

    const { tag_ids, ...postData } = data;
    const publication = this.handlePublicationDate(data.status || post.status, data.publish_at);

    return withTx(async (tx) => {
      if (data.slug && data.slug !== post.slug) {
        await handleSlugChange(EntityType.BLOG_POST, post.id, post.slug, data.slug, '/blog/post', tx);
      }

      const updatedPost = await this.repo.update(post.id, {
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
      }, tx);

      return updatedPost;
    });
  }

  async deletePost(slug: string, user: any) {
    const post = await this.repo.findFirst({ slug });
    if (!post) throw new ApiError(404, 'Post not found');

    if (!isStaff(user.role) && post.authorId !== user.id) {
      throw new ApiError(403, 'Forbidden');
    }

    await this.repo.softDelete(post.id);
    return { ok: true };
  }

  async getSimilarPosts(slug: string) {
    const post = await this.repo.findFirst({ slug, deletedAt: null });
    if (!post) throw new ApiError(404, 'Post not found');
    if (!post.categoryId) return { data: [] };

    const { data: similar } = await this.repo.findMany({
      where: {
        categoryId: post.categoryId,
        status: PostStatus.published,
        publishedAt: { lte: new Date() },
        id: { not: post.id },
        deletedAt: null
      },
      orderBy: { publishedAt: 'desc' },
      take: 5,
    });

    return { data: similar };
  }

  async getSameCategoryPosts(slug: string, query: any) {
    const post = await this.repo.findFirst({ slug, deletedAt: null });
    if (!post) throw new ApiError(404, 'Post not found');
    if (!post.categoryId) return { data: [], meta: { total: 0 } };

    const { page = 1, pageSize = 10 } = query;
    const limit = parseInt(pageSize as string) || 10;
    const skip = (parseInt(page as string || '1') - 1) * limit;

    const where: Prisma.PostWhereInput = {
      categoryId: post.categoryId,
      status: PostStatus.published,
      publishedAt: { lte: new Date() },
      id: { not: post.id },
      deletedAt: null
    };

    const { data, total } = await this.repo.findMany({
      where,
      orderBy: { publishedAt: 'desc' },
      skip,
      take: limit,
    });

    return {
      data: data,
      meta: { page: parseInt(page), pageSize: limit, total, totalPages: Math.ceil(total / limit) }
    };
  }

  async getRelatedPosts(slug: string) {
    const post = await this.repo.findFirst({ slug, deletedAt: null });
    if (!post) throw new ApiError(404, 'Post not found');

    const tagIds = (post.tags as any[]).map(t => t.tagId);
    if (tagIds.length === 0) return { data: [] };

    const { data: related } = await this.repo.findMany({
      where: {
        status: PostStatus.published,
        publishedAt: { lte: new Date() },
        id: { not: post.id },
        tags: { some: { tagId: { in: tagIds } } },
        deletedAt: null
      },
      take: 10,
    });

    // Sort by common tags manually
    related.sort((a: any, b: any) => {
      const aCommon = a.tags.filter((t: any) => tagIds.includes(t.tagId)).length;
      const bCommon = b.tags.filter((t: any) => tagIds.includes(t.tagId)).length;
      return bCommon - aCommon || (b.publishedAt?.getTime() || 0) - (a.publishedAt?.getTime() || 0);
    });

    return { data: related.slice(0, 5) };
  }

  async publishPost(slug: string, user: any) {
    const post = await this.repo.findFirst({ slug, deletedAt: null });
    if (!post) throw new ApiError(404, 'Post not found');

    if (!isStaff(user.role) && post.authorId !== user.id) {
      throw new ApiError(403, 'Forbidden');
    }

    if (post.status !== PostStatus.draft && post.status !== PostStatus.scheduled) {
      throw new ApiError(400, 'Only drafts or scheduled posts can be published');
    }

    const updated = await this.repo.update(post.id, {
      status: PostStatus.published,
      publishedAt: new Date(),
      scheduledAt: null
    });

    return updated;
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

}
