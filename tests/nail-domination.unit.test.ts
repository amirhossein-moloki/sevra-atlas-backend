import { PostServicesService } from '../src/modules/blog/post-services/postServices.service';
import { PostsService } from '../src/modules/blog/posts/posts.service';
import { SearchService } from '../src/modules/services/search.service';
import { GrowthService } from '../src/modules/growth/growth.service';
import { prisma } from '../src/shared/db/prisma';

jest.mock('../src/shared/redis/cache.service', () => ({
  CacheService: {
    wrap: jest.fn((key, cb) => cb()),
  },
}));

jest.mock('../src/shared/db/prisma', () => ({
  prisma: {
    postService: {
      upsert: jest.fn(),
      delete: jest.fn(),
      findMany: jest.fn(),
      deleteMany: jest.fn(),
      createMany: jest.fn(),
    },
    post: {
      findMany: jest.fn(),
      count: jest.fn(),
    },
    serviceDefinition: {
      findFirst: jest.fn(),
    },
    leadEvent: {
      create: jest.fn(),
    },
    $queryRaw: jest.fn(),
    $transaction: jest.fn((cb) => cb(prisma)),
  },
}));

describe('Nail Domination Architecture', () => {
  describe('PostServicesService', () => {
    let service: PostServicesService;

    beforeEach(() => {
      jest.clearAllMocks();
      service = new PostServicesService();
    });

    it('should attach post to service', async () => {
      await service.attachPostToService(BigInt(1), BigInt(2));
      expect(prisma.postService.upsert).toHaveBeenCalledWith({
        where: { postId_serviceId: { postId: BigInt(1), serviceId: BigInt(2) } },
        create: { postId: BigInt(1), serviceId: BigInt(2) },
        update: {},
      });
    });

    it('should get posts by service', async () => {
      await service.getPostsByService(BigInt(2));
      expect(prisma.postService.findMany).toHaveBeenCalledWith({
        where: { serviceId: BigInt(2) },
        include: expect.any(Object),
      });
    });
  });

  describe('PostsService Extension', () => {
    let service: PostsService;

    beforeEach(() => {
      jest.clearAllMocks();
      service = new PostsService();
    });

    it('should filter posts by service slug', async () => {
      (prisma.post.findMany as jest.Mock).mockResolvedValue([]);
      (prisma.post.count as jest.Mock).mockResolvedValue(0);

      await service.listPosts({ service: 'nail-implant' });

      expect(prisma.post.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            services: {
              some: {
                service: {
                  slug: 'nail-implant'
                }
              }
            }
          }),
        })
      );
    });
  });

  describe('SearchService Extension', () => {
    let service: SearchService;

    beforeEach(() => {
      jest.clearAllMocks();
      service = new SearchService();
    });

    it('should apply service filter in global search when context is nail', async () => {
      (prisma.$queryRaw as jest.Mock).mockResolvedValue([]);

      await service.globalSearch('test', 'nail');

      // Check if searchSalons and searchPosts were called
      expect(prisma.$queryRaw).toHaveBeenCalled();

      const calls = (prisma.$queryRaw as jest.Mock).mock.calls;
      // We expect 3 calls (salons, artists, posts)
      expect(calls.length).toBe(3);
    });
  });

  describe('GrowthService Extension', () => {
    let service: GrowthService;

    beforeEach(() => {
      jest.clearAllMocks();
      service = new GrowthService();
    });

    it('should track lead event', async () => {
      await service.trackLeadEvent({
        eventType: 'blog_to_salon',
        sourcePostId: BigInt(1),
        targetSalonId: BigInt(2),
        userId: BigInt(3),
      });

      expect(prisma.leadEvent.create).toHaveBeenCalledWith({
        data: {
          eventType: 'blog_to_salon',
          sourcePostId: BigInt(1),
          targetSalonId: BigInt(2),
          userId: BigInt(3),
        }
      });
    });
  });
});
