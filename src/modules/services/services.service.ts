import { prisma } from '../../shared/db/prisma';
import { ApiError } from '../../shared/errors/ApiError';

export class ServicesService {
  async listServiceCategories(query: any) {
    const { include, q, page = 1, pageSize = 20 } = query;
    const skip = (page - 1) * pageSize;

    const where: any = {};
    if (q) {
      where.nameFa = { contains: q, mode: 'insensitive' };
    }

    const [categories, total] = await Promise.all([
      prisma.serviceCategory.findMany({
        where,
        include: include === 'categories' ? { services: true } : false,
        skip,
        take: pageSize,
        orderBy: { order: 'asc' },
      }),
      prisma.serviceCategory.count({ where }),
    ]);

    return {
      data: categories.map(c => this.serialize(c)),
      meta: { page, pageSize, total, totalPages: Math.ceil(total / pageSize) },
    };
  }

  async getServiceBySlug(slug: string) {
    const service = await prisma.serviceDefinition.findUnique({
      where: { slug },
    });
    if (!service) throw new ApiError(404, 'Service not found');
    return this.serialize(service);
  }

  async createCategory(data: any) {
    const category = await prisma.serviceCategory.create({ data });
    return this.serialize(category);
  }

  async createService(data: any) {
    const service = await prisma.serviceDefinition.create({
      data: {
        ...data,
        categoryId: BigInt(data.categoryId),
      },
    });
    return this.serialize(service);
  }

  async updateService(id: string, data: any) {
    const service = await prisma.serviceDefinition.update({
      where: { id: BigInt(id) },
      data: {
        ...data,
        categoryId: data.categoryId ? BigInt(data.categoryId) : undefined,
      },
    });
    return this.serialize(service);
  }

  async deleteService(id: string) {
    await prisma.serviceDefinition.delete({
      where: { id: BigInt(id) },
    });
    return { ok: true };
  }

  private serialize(obj: any) {
    if (!obj) return null;
    const res = { ...obj };
    if (res.id) res.id = res.id.toString();
    if (res.categoryId) res.categoryId = res.categoryId.toString();
    if (res.services) {
      res.services = res.services.map((s: any) => this.serialize(s));
    }
    return res;
  }
}
