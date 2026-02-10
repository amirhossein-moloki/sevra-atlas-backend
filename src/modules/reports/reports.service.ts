import { prisma } from '../../shared/db/prisma';
import { EntityType, ReportStatus } from '@prisma/client';

export class ReportsService {
  async createReport(userId: bigint, data: any) {
    const { targetType, targetId, reason, details } = data;
    const report = await prisma.report.create({
      data: {
        reporterId: userId,
        targetType: targetType as EntityType,
        targetId: BigInt(targetId),
        reason,
        details,
        reviewId: targetType === 'REVIEW' ? BigInt(targetId) : null,
      },
    });
    return this.serialize(report);
  }

  async listReports(query: any) {
    const { status, targetType, page = 1, pageSize = 20 } = query;
    const limit = parseInt(pageSize as string) || 20;
    const skip = (parseInt(page as string || '1') - 1) * limit;

    const where: any = {};
    if (status) where.status = status as ReportStatus;
    if (targetType) where.targetType = targetType as EntityType;

    const [data, total] = await Promise.all([
      prisma.report.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.report.count({ where }),
    ]);

    return {
      data: data.map(r => this.serialize(r)),
      meta: { page: parseInt(page as string || '1'), pageSize: limit, total, totalPages: Math.ceil(total / limit) },
    };
  }

  async updateReportStatus(id: bigint, status: ReportStatus) {
    await prisma.report.update({
      where: { id },
      data: { status },
    });
    return { ok: true };
  }

  private serialize(obj: any): any {
    if (!obj) return null;
    if (Array.isArray(obj)) return obj.map(o => this.serialize(o));
    const res = { ...obj };
    for (const key in res) {
      if (typeof res[key] === 'bigint') res[key] = res[key].toString();
      else if (typeof res[key] === 'object' && res[key] !== null && !(res[key] instanceof Date)) res[key] = this.serialize(res[key]);
    }
    return res;
  }
}
