import { BlogTaxonomyService } from '../src/modules/blog/taxonomy.service';
import { prisma } from '../src/shared/db/prisma';
import { ApiError } from '../src/shared/errors/ApiError';

jest.mock('../src/shared/db/prisma', () => ({
  prisma: {
    category: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      findFirst: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    tag: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      findFirst: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    series: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      findFirst: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    $transaction: jest.fn((cb) => cb(prisma)),
  },
}));

describe('BlogTaxonomyService', () => {
  let service: BlogTaxonomyService;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new BlogTaxonomyService();
  });

  describe('categories', () => {
    it('should list categories', async () => {
      (prisma.category.findMany as jest.Mock).mockResolvedValue([{ id: BigInt(1), name: 'Cat 1' }]);
      const result = await service.listCategories();
      expect(result).toHaveLength(1);
      expect(prisma.category.findMany).toHaveBeenCalled();
    });

    it('should create a category', async () => {
      (prisma.category.create as jest.Mock).mockResolvedValue({ id: BigInt(1), name: 'New Cat' });
      const result = await service.createCategory({ name: 'New Cat', slug: 'new-cat' });
      expect(result.name).toBe('New Cat');
      expect(prisma.category.create).toHaveBeenCalled();
    });
  });

  describe('tags', () => {
    it('should list tags', async () => {
      (prisma.tag.findMany as jest.Mock).mockResolvedValue([{ id: BigInt(1), name: 'Tag 1' }]);
      const result = await service.listTags();
      expect(result).toHaveLength(1);
    });

    it('should throw 404 if tag not found', async () => {
      (prisma.tag.findFirst as jest.Mock).mockResolvedValue(null);
      await expect(service.getTag(BigInt(1))).rejects.toThrow(ApiError);
    });
  });
});
