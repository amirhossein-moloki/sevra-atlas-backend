import { prisma } from '../../shared/db/prisma';
import { TransactionClient } from '../../shared/db/tx';
import { Prisma } from '@prisma/client';

export class AdminRepository {
  private db(tx?: TransactionClient) {
    return tx || prisma;
  }

  async countUsers(where: Prisma.UserWhereInput, tx?: TransactionClient) {
    return this.db(tx).user.count({ where });
  }

  async countSalons(where: Prisma.SalonWhereInput, tx?: TransactionClient) {
    return this.db(tx).salon.count({ where });
  }

  async countArtists(where: Prisma.ArtistWhereInput, tx?: TransactionClient) {
    return this.db(tx).artist.count({ where });
  }

  async countReviews(where: Prisma.ReviewWhereInput, tx?: TransactionClient) {
    return this.db(tx).review.count({ where });
  }

  async countReports(where: Prisma.ReportWhereInput, tx?: TransactionClient) {
    return this.db(tx).report.count({ where });
  }

  async countVerificationRequests(where: Prisma.VerificationRequestWhereInput, tx?: TransactionClient) {
    return this.db(tx).verificationRequest.count({ where });
  }

  async groupBySalons(args: any, tx?: TransactionClient) {
    return this.db(tx).salon.groupBy(args);
  }

  async groupByReviews(args: any, tx?: TransactionClient) {
    return this.db(tx).review.groupBy(args);
  }

  async groupByPosts(args: any, tx?: TransactionClient) {
    return this.db(tx).post.groupBy(args);
  }

  async findCityUnique(id: bigint, tx?: TransactionClient) {
    return this.db(tx).city.findUnique({ where: { id } });
  }

  async getDailyStats(table: string, column: string, from: Date, to: Date, deletedColumn?: string) {
    const deletedFilter = deletedColumn ? `AND "${deletedColumn}" IS NULL` : '';
    const data = await prisma.$queryRawUnsafe<any[]>(`
      SELECT DATE_TRUNC('day', "${column}") as date, COUNT(*)::int as count
      FROM "${table}"
      WHERE "${column}" >= $1 AND "${column}" <= $2 ${deletedFilter}
      GROUP BY date
      ORDER BY date ASC
    `, from, to);
    return data;
  }

  async ping() {
    return prisma.$queryRaw`SELECT 1`;
  }
}

export const adminRepository = new AdminRepository();
