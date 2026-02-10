import { prisma } from '../../shared/db/prisma';
import { ApiError } from '../../shared/errors/ApiError';
import { serialize } from '../../shared/utils/serialize';

export class ServicesService {
  async listServiceCategories(query: any) {
    const { include, q, page = 1, pageSize = 20 } = query;
    const skip = (parseInt(page as string || '1') - 1) * (parseInt(pageSize as string) || 20);
    const limit = parseInt(pageSize as string) || 20;

    const where: any = { deletedAt: null };
    if (q) {
      where.nameFa = { contains: q, mode: 'insensitive' };
    }

    const [categories, total] = await Promise.all([
      prisma.serviceCategory.findMany({
        where,
        include: include === 'categories' ? { services: true } : undefined,
        skip,
        take: limit,
        orderBy: { order: 'asc' },
      }),
      prisma.serviceCategory.count({ where }),
    ]);

    return {
      data: serialize(categories),
      meta: { page: parseInt(page as string || '1'), pageSize: limit, total, totalPages: Math.ceil(total / limit) },
    };
  }

  async getServiceBySlug(slug: string) {
    const service = await prisma.serviceDefinition.findFirst({
      where: { slug, deletedAt: null },
    });
    if (!service) throw new ApiError(404, 'Service not found');
    return serialize(service);
  }

  async createCategory(data: any) {
    const category = await prisma.serviceCategory.create({ data });
    return serialize(category);
  }

  async createService(data: any) {
    const service = await prisma.serviceDefinition.create({
      data: {
        ...data,
        categoryId: BigInt(data.categoryId),
      },
    });
    return serialize(service);
  }

  async updateService(id: string, data: any) {
    const service = await prisma.serviceDefinition.update({
      where: { id: BigInt(id) },
      data: {
        ...data,
        categoryId: data.categoryId ? BigInt(data.categoryId) : undefined,
      },
    });
    return serialize(service);
  }

  async updateCategory(id: string, data: any) {
    const category = await prisma.serviceCategory.update({
      where: { id: BigInt(id) },
      data,
    });
    return serialize(category);
  }

  async deleteCategory(id: string) {
    await prisma.serviceCategory.update({
      where: { id: BigInt(id) },
      data: { deletedAt: new Date() },
    });
    return { ok: true };
  }

  async deleteService(id: string) {
    await prisma.serviceDefinition.update({
      where: { id: BigInt(id) },
      data: { deletedAt: new Date() },
    });
    return { ok: true };
  }
}
