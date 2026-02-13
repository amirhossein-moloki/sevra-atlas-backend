import { EntityType, ReportStatus, Prisma } from '@prisma/client';
import { reportsRepository, ReportsRepository } from './reports.repository';

export class ReportsService {
  constructor(
    private readonly repo: ReportsRepository = reportsRepository
  ) {}

  async createReport(userId: bigint, data: any) {
    const { targetType, targetId, reason, details } = data;
    const report = await this.repo.create({
      reporterId: userId,
      targetType: targetType as EntityType,
      targetId: BigInt(targetId),
      reason,
      details,
      reviewId: targetType === 'REVIEW' ? BigInt(targetId) : null,
    });
    return report;
  }

  async listReports(query: any) {
    const { status, targetType, page = 1, pageSize = 20 } = query;
    const limit = parseInt(pageSize as string) || 20;
    const skip = (parseInt(page as string || '1') - 1) * limit;

    const where: Prisma.ReportWhereInput = {};
    if (status) where.status = status as ReportStatus;
    if (targetType) where.targetType = targetType as EntityType;

    const { data, total } = await this.repo.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip,
      take: limit,
    });

    return {
      data: data,
      meta: { page: parseInt(page as string || '1'), pageSize: limit, total, totalPages: Math.ceil(total / limit) },
    };
  }

  async updateReportStatus(id: bigint, status: ReportStatus) {
    await this.repo.update(id, { status });
    return { ok: true };
  }

}
