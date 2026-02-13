import { prisma } from '../../shared/db/prisma';
import { TransactionClient } from '../../shared/db/tx';
import { Prisma } from '@prisma/client';

export class AuthRepository {
  private db(tx?: TransactionClient) {
    return tx || prisma;
  }

  async deleteOtps(phoneE164: string, tx?: TransactionClient) {
    return this.db(tx).otp.deleteMany({ where: { phoneE164 } });
  }

  async upsertOtp(phoneE164: string, data: { code: string; expiresAt: Date; attempts: number }, tx?: TransactionClient) {
    return this.db(tx).otp.upsert({
      where: { phoneE164 },
      update: data,
      create: { phoneE164, ...data },
    });
  }

  async createOtpAttempt(data: Prisma.OtpAttemptUncheckedCreateInput, tx?: TransactionClient) {
    return this.db(tx).otpAttempt.create({ data });
  }

  async findOtpUnique(phoneE164: string, tx?: TransactionClient) {
    return this.db(tx).otp.findUnique({ where: { phoneE164 } });
  }

  async updateOtp(phoneE164: string, data: Prisma.OtpUpdateInput, tx?: TransactionClient) {
    return this.db(tx).otp.update({ where: { phoneE164 }, data });
  }

  async createRefreshToken(data: Prisma.RefreshTokenUncheckedCreateInput, tx?: TransactionClient) {
    return this.db(tx).refreshToken.create({ data });
  }

  async findRefreshTokenUnique(token: string, tx?: TransactionClient) {
    return this.db(tx).refreshToken.findUnique({ where: { token } });
  }

  async deleteRefreshToken(token: string, tx?: TransactionClient) {
    return this.db(tx).refreshToken.deleteMany({ where: { token } });
  }
}

export const authRepository = new AuthRepository();
