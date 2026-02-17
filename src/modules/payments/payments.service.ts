import { prisma } from '../../shared/db/prisma';
import { ApiError } from '../../shared/errors/ApiError';
import { PaymentStatus, EntityType } from '@prisma/client';
import { zibalProvider } from './zibal.provider';
import { SubscriptionsService } from '../subscriptions/subscriptions.service';
import { logger } from '../../shared/logger/logger';
import { paymentCounter } from '../../shared/metrics';

export class PaymentsService {
  private subscriptionsService = new SubscriptionsService();

  private getPaymentUrl(trackId: string): string {
    return `https://gateway.zibal.ir/start/${trackId}`;
  }

  async createPaymentIntent(params: {
    userId: bigint;
    amount: bigint;
    planId: bigint;
    salonId?: bigint;
    artistId?: bigint;
    description?: string;
    idempotencyKey: string;
    mobile?: string;
  }) {
    const { userId, amount, planId, salonId, artistId, description, idempotencyKey, mobile } = params;

    // 1. Check idempotency
    const existingPayment = await prisma.payment.findUnique({
      where: { idempotencyKey },
    });

    if (existingPayment) {
      if (existingPayment.status === PaymentStatus.INITIATED && existingPayment.providerTrackId) {
        return {
          paymentId: existingPayment.id.toString(),
          trackId: existingPayment.providerTrackId,
          paymentUrl: this.getPaymentUrl(existingPayment.providerTrackId),
        };
      }
      throw new ApiError(400, 'A payment with this idempotency key already exists');
    }

    // 2. Validate Plan and amount
    const plan = await prisma.plan.findUnique({ where: { id: planId } });
    if (!plan) throw new ApiError(404, 'Plan not found');

    if (salonId && plan.entityType !== EntityType.SALON) {
      throw new ApiError(400, 'Plan is not for Salons');
    }
    if (artistId && plan.entityType !== EntityType.ARTIST) {
      throw new ApiError(400, 'Plan is not for Artists');
    }

    if (plan.price !== amount) {
      throw new ApiError(400, `Amount mismatch. Plan price is ${plan.price}`);
    }

    // 3. Create Payment record
    const payment = await prisma.payment.create({
      data: {
        userId,
        amount,
        planId,
        salonId,
        artistId,
        description,
        idempotencyKey,
        status: PaymentStatus.PENDING,
      },
    });

    // 4. Call Zibal
    try {
      const zibalResponse = await zibalProvider.request({
        amount: Number(amount),
        orderId: payment.id.toString(),
        mobile,
        description,
      });

      if (zibalResponse.result !== 100) {
        await prisma.payment.update({
          where: { id: payment.id },
          data: { status: PaymentStatus.FAILED, metadata: { zibalError: zibalResponse.message } },
        });
        paymentCounter.labels('zibal', 'failed', 'init').inc();
        throw new ApiError(400, `Zibal error: ${zibalResponse.message}`);
      }

      const trackId = zibalResponse.trackId!.toString();

      // 5. Update Payment with trackId
      const updatedPayment = await prisma.payment.update({
        where: { id: payment.id },
        data: {
          status: PaymentStatus.INITIATED,
          providerTrackId: trackId,
        },
      });

      paymentCounter.labels('zibal', 'initiated', 'init').inc();

      return {
        paymentId: updatedPayment.id.toString(),
        trackId: updatedPayment.providerTrackId,
        paymentUrl: this.getPaymentUrl(trackId),
      };
    } catch (error) {
      logger.error({ error, paymentId: payment.id.toString() }, 'Error initiating Zibal payment');
      throw error;
    }
  }

  async handleCallback(params: {
    trackId: string;
    success: string;
    status: string;
    orderId?: string;
  }) {
    const { trackId, success, status } = params;

    const payment = await prisma.payment.findUnique({
      where: { providerTrackId: trackId },
    });

    if (!payment) {
      logger.warn({ trackId }, 'Payment not found for callback');
      throw new ApiError(404, 'Payment not found');
    }

    if (payment.status === PaymentStatus.VERIFIED) {
      return { status: 'ALREADY_PAID', payment };
    }

    if (success !== '1') {
      const updated = await prisma.payment.update({
        where: { id: payment.id },
        data: { status: PaymentStatus.FAILED, metadata: { callbackStatus: status, success } },
      });
      paymentCounter.labels('zibal', 'failed', 'callback').inc();
      return { status: 'FAILED', payment: updated };
    }

    // Update to PAID temporarily while verifying
    await prisma.payment.update({
      where: { id: payment.id },
      data: { status: PaymentStatus.PAID },
    });

    // Verify with Zibal
    const verifyResponse = await zibalProvider.verify({ trackId });

    if (verifyResponse.result === 100) {
      // Security: Verify amount matches
      if (verifyResponse.amount && BigInt(verifyResponse.amount) !== payment.amount) {
        logger.error({
          paymentId: payment.id.toString(),
          expected: payment.amount.toString(),
          actual: verifyResponse.amount
        }, 'Payment amount mismatch');

        await prisma.payment.update({
          where: { id: payment.id },
          data: { status: PaymentStatus.FAILED, metadata: { verifyError: 'Amount mismatch', zibalAmount: verifyResponse.amount } },
        });
        throw new ApiError(400, 'Payment amount mismatch');
      }

      return await prisma.$transaction(async (tx) => {
        // Re-check status inside transaction to prevent race conditions
        const p = await tx.payment.findUnique({ where: { id: payment.id } });
        if (p?.status === PaymentStatus.VERIFIED) return { status: 'ALREADY_PAID', payment: p };

        const updatedPayment = await tx.payment.update({
          where: { id: payment.id },
          data: {
            status: PaymentStatus.VERIFIED,
            providerRefNumber: verifyResponse.refNumber?.toString(),
            metadata: {
              ...((payment.metadata as object) || {}),
              verifyResponse: verifyResponse as any,
              cardNumber: verifyResponse.cardNumber
            },
          },
        });

        const targetType = payment.salonId ? 'SALON' : 'ARTIST';
        const targetId = payment.salonId || payment.artistId;
        if (!targetId) throw new ApiError(400, 'Target (Salon/Artist) not found in payment');

        await this.subscriptionsService.assignPlanInternal(
          tx,
          targetType as 'SALON' | 'ARTIST',
          targetId,
          payment.planId!,
          `Zibal Payment: ${trackId}`,
          payment.userId,
          'ZIBAL'
        );

        paymentCounter.labels('zibal', 'verified', 'verify').inc();
        logger.info({ paymentId: payment.id.toString(), trackId }, 'Payment verified and subscription activated');

        return { status: 'SUCCESS', payment: updatedPayment };
      });
    } else {
      const updated = await prisma.payment.update({
        where: { id: payment.id },
        data: { status: PaymentStatus.FAILED, metadata: { verifyError: verifyResponse.message, verifyResult: verifyResponse.result } },
      });
      paymentCounter.labels('zibal', 'failed', 'verify').inc();
      return { status: 'VERIFY_FAILED', payment: updated, error: verifyResponse.message };
    }
  }

  async getPaymentById(id: bigint) {
    return prisma.payment.findUnique({
      where: { id },
      include: { user: true, plan: true, salon: true, artist: true },
    });
  }
}
