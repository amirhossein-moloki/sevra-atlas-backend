import { Request, Response } from 'express';
import { PaymentsService } from './payments.service';
import { safeBigInt } from '../../shared/utils/bigint';
import { sendOk, sendFail } from '../../shared/utils/response';
import { logger } from '../../shared/logger/logger';
import { config } from '../../config';
import { prisma } from '../../shared/db/prisma';

const service = new PaymentsService();

export class PaymentsController {
  async initZibal(req: Request, res: Response) {
    const { amount, planId, salonId, artistId, description, idempotencyKey, mobile } = req.body;
    const userId = req.user?.id;

    if (!userId) {
      return sendFail(res, 'UNAUTHORIZED', 'User not authenticated', 401);
    }

    try {
      let userMobile = mobile;
      if (!userMobile) {
        const user = await prisma.user.findUnique({ where: { id: userId }, select: { phoneNumber: true } });
        userMobile = user?.phoneNumber;
      }

      const result = await service.createPaymentIntent({
        userId,
        amount: safeBigInt(amount, 'amount'),
        planId: safeBigInt(planId, 'planId'),
        salonId: salonId ? safeBigInt(salonId, 'salonId') : undefined,
        artistId: artistId ? safeBigInt(artistId, 'artistId') : undefined,
        description,
        idempotencyKey: idempotencyKey || `pay_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        mobile: userMobile,
      });

      return sendOk(res, result);
    } catch (error: unknown) {
      logger.error({ error, userId: userId.toString() }, 'Failed to init Zibal payment');
      const message = error instanceof Error ? error.message : 'Internal error';
      const statusCode = (error as { statusCode?: number })?.statusCode || 500;
      return sendFail(res, 'PAYMENT_INIT_FAILED', message, statusCode);
    }
  }

  async zibalCallback(req: Request, res: Response) {
    const { trackId, success, status, orderId } = req.query;

    if (!trackId) {
      return sendFail(res, 'INVALID_CALLBACK', 'trackId is missing', 400);
    }

    try {
      const result = await service.handleCallback({
        trackId: trackId as string,
        success: success as string,
        status: status as string,
        orderId: orderId as string,
      });

      const frontendUrl = config.server.baseUrl || 'http://localhost:3000';
      const redirectUrl = `${frontendUrl}/payment-result?status=${result.status}&paymentId=${result.payment.id.toString()}`;

      if (req.accepts('html')) {
        return res.redirect(redirectUrl);
      }

      return sendOk(res, {
        status: result.status,
        paymentId: result.payment.id.toString(),
        trackId: result.payment.providerTrackId,
        redirectUrl
      });
    } catch (error: unknown) {
      logger.error({ error, trackId }, 'Zibal callback handling failed');
      const message = error instanceof Error ? error.message : 'Internal error';
      const statusCode = (error as { statusCode?: number })?.statusCode || 500;
      return sendFail(res, 'CALLBACK_FAILED', message, statusCode);
    }
  }

  async getPaymentStatus(req: Request, res: Response) {
    const { id } = req.params;
    try {
      const payment = await service.getPaymentById(safeBigInt(id, 'id'));
      if (!payment) return sendFail(res, 'NOT_FOUND', 'Payment not found', 404);

      if (payment.userId !== req.user?.id && req.user?.role !== 'ADMIN') {
        return sendFail(res, 'FORBIDDEN', 'Access denied', 403);
      }

      return sendOk(res, payment);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Internal error';
      const statusCode = (error as { statusCode?: number })?.statusCode || 500;
      return sendFail(res, 'ERROR', message, statusCode);
    }
  }
}
