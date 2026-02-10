import { BlogCommentsService } from '../src/modules/blog/comments/comments.service';
import { prisma } from '../src/shared/db/prisma';
import { ApiError } from '../src/shared/errors/ApiError';

jest.mock('../src/shared/db/prisma', () => ({
  prisma: {
    comment: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      findFirst: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
    post: {
      findUnique: jest.fn(),
    },
  },
}));

describe('BlogCommentsService', () => {
  let service: BlogCommentsService;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new BlogCommentsService();
  });

  describe('createComment', () => {
    it('should throw 404 if post not found', async () => {
      (prisma.post.findUnique as jest.Mock).mockResolvedValue(null);
      await expect(service.createComment('slug', BigInt(1), { content: 'test' }))
        .rejects.toThrow(ApiError);
    });

    it('should create a comment if post exists', async () => {
      (prisma.post.findUnique as jest.Mock).mockResolvedValue({ id: BigInt(1) });
      (prisma.comment.create as jest.Mock).mockResolvedValue({ id: BigInt(10), content: 'test' });

      const result = await service.createComment('slug', BigInt(1), { content: 'test' });
      expect(result.content).toBe('test');
      expect(prisma.comment.create).toHaveBeenCalled();
    });
  });

  describe('updateCommentStatus', () => {
    it('should update status as admin', async () => {
      (prisma.comment.update as jest.Mock).mockResolvedValue({ id: BigInt(10), status: 'approved' });
      const result = await service.updateCommentStatus(BigInt(10), 'approved');
      expect(result.status).toBe('approved');
    });
  });
});
