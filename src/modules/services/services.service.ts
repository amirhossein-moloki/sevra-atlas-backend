import { ApiError } from '../../shared/errors/ApiError';
import { servicesRepository, ServicesRepository } from './services.repository';
import { withTx } from '../../shared/db/tx';
import { Prisma } from '@prisma/client';

export class ServicesService {
  constructor(
    private readonly repo: ServicesRepository = servicesRepository
  ) {}

  async listServiceCategories(query: any) {
    const { include, q, page = 1, pageSize = 20 } = query;
    const limit = parseInt(pageSize as string) || 20;
    const skip = (parseInt(page as string || '1') - 1) * limit;

    const where: Prisma.ServiceCategoryWhereInput = { deletedAt: null };
    if (q) {
      where.nameFa = { contains: q as string, mode: 'insensitive' as const };
    }

    const { data: categories, total } = await this.repo.findCategories({
      where,
      include: include === 'categories' ? { services: true } : undefined,
      skip,
      take: limit,
      orderBy: { order: 'asc' },
    });

    return {
      data: categories,
      meta: { page: parseInt(page as string || '1'), pageSize: limit, total, totalPages: Math.ceil(total / limit) },
    };
  }

  async getServiceBySlug(slug: string) {
    const service = await this.repo.findServiceFirst({ slug, deletedAt: null });
    if (!service) throw new ApiError(404, 'Service not found');
    return service;
  }

  async createCategory(data: any) {
    return this.repo.createCategory(data);
  }

  async createService(data: any) {
    return this.repo.createService({
      ...data,
      categoryId: BigInt(data.categoryId),
    });
  }

  async updateService(id: string, data: any) {
    return this.repo.updateService(BigInt(id), {
      ...data,
      categoryId: data.categoryId ? BigInt(data.categoryId) : undefined,
    });
  }

  async updateCategory(id: string, data: any) {
    return this.repo.updateCategory(BigInt(id), data);
  }

  async deleteCategory(id: string) {
    await this.repo.softDeleteCategory(BigInt(id));
    return { ok: true };
  }

  async deleteService(id: string) {
    await this.repo.softDeleteService(BigInt(id));
    return { ok: true };
  }

  async reorderCategories(items: { id: string | bigint, order: number }[]) {
    return withTx(async (tx) => {
      const results = [];
      for (const item of items) {
        const updated = await this.repo.updateCategory(BigInt(item.id), { order: item.order }, tx);
        results.push(updated);
      }
      return results;
    });
  }
}
