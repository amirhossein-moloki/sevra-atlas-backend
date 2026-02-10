import { PostsService } from '../src/modules/blog/posts/posts.service';
import { prisma } from '../src/shared/db/prisma';
import { PostStatus, UserRole } from '@prisma/client';
import { ApiError } from '../src/shared/errors/ApiError';

jest.mock('../src/shared/db/prisma', () => ({
  prisma: {
    post: {
      findMany: jest.fn(),
      findFirst: jest.fn(),
      findUnique: jest.fn(),
      count: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
    authorProfile: {
      findUnique: jest.fn(),
    },
    $transaction: jest.fn((cb) => cb(prisma)),
  },
}));

describe('PostsService', () => {
  let service: PostsService;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new PostsService();
  });

  describe('listPosts', () => {
    it('should return only published posts for anonymous users', async () => {
      (prisma.post.findMany as jest.Mock).mockResolvedValue([]);
      (prisma.post.count as jest.Mock).mockResolvedValue(0);

      await service.listPosts({});

      expect(prisma.post.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            status: PostStatus.published,
          }),
        })
      );
    });

    it('should return all posts for admin users', async () => {
      (prisma.post.findMany as jest.Mock).mockResolvedValue([]);
      (prisma.post.count as jest.Mock).mockResolvedValue(0);

      await service.listPosts({}, { role: UserRole.ADMIN });

      expect(prisma.post.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.not.objectContaining({
            status: PostStatus.published,
          }),
        })
      );
    });
  });

  describe('getPostBySlug', () => {
    it('should throw 404 if post not found', async () => {
      (prisma.post.findFirst as jest.Mock).mockResolvedValue(null);

      await expect(service.getPostBySlug('non-existent')).rejects.toThrow(ApiError);
    });

    it('should throw 404 if post is draft and user is not author or admin', async () => {
      (prisma.post.findFirst as jest.Mock).mockResolvedValue({
        id: BigInt(1),
        slug: 'draft-post',
        status: PostStatus.draft,
        authorId: BigInt(2),
      });

      await expect(service.getPostBySlug('draft-post', { id: BigInt(3), role: UserRole.USER }))
        .rejects.toThrow(ApiError);
    });

    it('should return post if user is the author', async () => {
      const mockPost = {
        id: BigInt(1),
        slug: 'draft-post',
        status: PostStatus.draft,
        authorId: BigInt(2),
      };
      (prisma.post.findFirst as jest.Mock).mockResolvedValue(mockPost);
      (prisma.post.update as jest.Mock).mockResolvedValue(mockPost);

      const result = await service.getPostBySlug('draft-post', { id: BigInt(2), role: UserRole.AUTHOR });

      expect(result).toBeDefined();
      expect(prisma.post.update).toHaveBeenCalled(); // views increment
    });
  });

  describe('createPost', () => {
    it('should throw error if user has no author profile', async () => {
      (prisma.authorProfile.findUnique as jest.Mock).mockResolvedValue(null);

      await expect(service.createPost({ title: 'Test' }, BigInt(1)))
        .rejects.toThrow(ApiError);
    });

    it('should create a post if user is an author', async () => {
      (prisma.authorProfile.findUnique as jest.Mock).mockResolvedValue({ userId: BigInt(1) });
      (prisma.post.create as jest.Mock).mockResolvedValue({ id: BigInt(100), title: 'Test' });

      const result = await service.createPost({ title: 'Test', status: 'draft' }, BigInt(1));

      expect(result).toBeDefined();
      expect(prisma.post.create).toHaveBeenCalled();
    });
  });
});
