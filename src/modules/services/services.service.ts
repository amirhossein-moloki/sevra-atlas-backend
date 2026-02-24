import { prisma } from '../../shared/db/prisma';
import { ApiError } from '../../shared/errors/ApiError';

export class ServicesService {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  async listServiceCategories(query: any) {
    const { include, q, page = 1, pageSize = 20 } = query;
    const skip = (parseInt(page as string || '1') - 1) * (parseInt(pageSize as string) || 20);
    const limit = parseInt(pageSize as string) || 20;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
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
      data: categories,
      meta: { page: parseInt(page as string || '1'), pageSize: limit, total, totalPages: Math.ceil(total / limit) },
    };
  }

  async getServiceByIdentifier(identifier: string) {
    const where: any = { deletedAt: null };
    if (/^\d+$/.test(identifier)) {
      where.id = BigInt(identifier);
    } else {
      where.slug = identifier;
    }

    const service = await prisma.serviceDefinition.findFirst({
      where,
    });
    if (!service) throw new ApiError(404, 'Service not found');
    return service;
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  async createCategory(data: any) {
    const category = await prisma.serviceCategory.create({ data });
    return category;
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  async createService(data: any) {
    const service = await prisma.serviceDefinition.create({
      data: {
        ...data,
        categoryId: BigInt(data.categoryId),
      },
    });
    return service;
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  async updateService(id: string, data: any) {
    const service = await prisma.serviceDefinition.update({
      where: { id: BigInt(id) },
      data: {
        ...data,
        categoryId: data.categoryId ? BigInt(data.categoryId) : undefined,
      },
    });
    return service;
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  async updateCategory(id: string, data: any) {
    const category = await prisma.serviceCategory.update({
      where: { id: BigInt(id) },
      data,
    });
    return category;
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

  async reorderCategories(items: { id: string | bigint, order: number }[]) {
    return prisma.$transaction(
      items.map(item => prisma.serviceCategory.update({
        where: { id: BigInt(item.id) },
        data: { order: item.order }
      }))
    );
  }
}
