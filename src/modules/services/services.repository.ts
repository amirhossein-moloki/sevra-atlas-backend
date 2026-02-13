import { prisma } from '../../shared/db/prisma';
import { TransactionClient } from '../../shared/db/tx';
import { Prisma } from '@prisma/client';

export class ServicesRepository {
  private db(tx?: TransactionClient) {
    return tx || prisma;
  }

  // Categories
  async findCategories(params: Prisma.ServiceCategoryFindManyArgs, tx?: TransactionClient) {
    const [data, total] = await Promise.all([
      this.db(tx).serviceCategory.findMany(params),
      this.db(tx).serviceCategory.count({ where: params.where }),
    ]);
    return { data, total };
  }

  async findCategoryUnique(id: bigint, tx?: TransactionClient) {
    return this.db(tx).serviceCategory.findUnique({ where: { id } });
  }

  async createCategory(data: Prisma.ServiceCategoryUncheckedCreateInput, tx?: TransactionClient) {
    return this.db(tx).serviceCategory.create({ data });
  }

  async updateCategory(id: bigint, data: Prisma.ServiceCategoryUncheckedUpdateInput, tx?: TransactionClient) {
    return this.db(tx).serviceCategory.update({ where: { id }, data });
  }

  async softDeleteCategory(id: bigint, tx?: TransactionClient) {
    return this.db(tx).serviceCategory.update({ where: { id }, data: { deletedAt: new Date() } });
  }

  // Service Definitions
  async findServiceFirst(where: Prisma.ServiceDefinitionWhereInput, tx?: TransactionClient) {
    return this.db(tx).serviceDefinition.findFirst({ where });
  }

  async findServiceUnique(id: bigint, tx?: TransactionClient) {
    return this.db(tx).serviceDefinition.findUnique({ where: { id } });
  }

  async createService(data: Prisma.ServiceDefinitionUncheckedCreateInput, tx?: TransactionClient) {
    return this.db(tx).serviceDefinition.create({ data });
  }

  async updateService(id: bigint, data: Prisma.ServiceDefinitionUncheckedUpdateInput, tx?: TransactionClient) {
    return this.db(tx).serviceDefinition.update({ where: { id }, data });
  }

  async softDeleteService(id: bigint, tx?: TransactionClient) {
    return this.db(tx).serviceDefinition.update({ where: { id }, data: { deletedAt: new Date() } });
  }

  // Raw Search
  async searchSalons(query: string) {
    return prisma.$queryRaw`
      SELECT id, name, slug, summary, "avgRating", "reviewCount"
      FROM "Salon"
      WHERE search_vector @@ plainto_tsquery('simple', ${query})
      ORDER BY ts_rank(search_vector, plainto_tsquery('simple', ${query})) DESC
      LIMIT 20
    `;
  }

  async searchArtists(query: string) {
    return prisma.$queryRaw`
      SELECT id, "fullName", slug, summary, "avgRating", "reviewCount"
      FROM "Artist"
      WHERE search_vector @@ plainto_tsquery('simple', ${query})
      ORDER BY ts_rank(search_vector, plainto_tsquery('simple', ${query})) DESC
      LIMIT 20
    `;
  }

  async searchPosts(query: string) {
    return prisma.$queryRaw`
      SELECT id, title, slug, excerpt, published_at
      FROM "blog_post"
      WHERE search_vector @@ plainto_tsquery('simple', ${query})
      AND status = 'published'
      ORDER BY ts_rank(search_vector, plainto_tsquery('simple', ${query})) DESC
      LIMIT 20
    `;
  }
}

export const servicesRepository = new ServicesRepository();
