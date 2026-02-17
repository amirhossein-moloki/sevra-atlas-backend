import Zibal from 'zibal';
import { config } from '../../config';
import { logger } from '../../shared/logger/logger';
import { paymentLatency } from '../../shared/metrics';

export interface ZibalRequestOptions {
  amount: number;
  orderId?: string;
  mobile?: string;
  description?: string;
  allowedCards?: string[];
  linkToPay?: boolean;
  sms?: boolean;
  callbackUrl?: string;
}

export interface ZibalVerifyOptions {
  trackId: string | number;
}

export interface ZibalResponse {
  result: number;
  message: string;
  trackId?: number;
  paymentUrl?: string;
  amount?: number;
  refNumber?: number;
  status?: number;
  payDate?: string;
  cardNumber?: string;
}

export class ZibalProvider {
  private zibal: Zibal;

  constructor() {
    this.zibal = new Zibal({
      merchant: config.zibal.merchant,
      callbackUrl: config.zibal.callbackUrl,
    });
  }

  async request(options: ZibalRequestOptions): Promise<ZibalResponse> {
    const start = process.hrtime();
    logger.info({ amount: options.amount, orderId: options.orderId }, 'Initiating Zibal payment request');

    try {
      const response = await this.zibal.request(options);
      const duration = process.hrtime(start);
      paymentLatency.labels('zibal', 'request').observe(duration[0] + duration[1] / 1e9);

      if (response.result !== 100) {
        logger.error({ result: response.result, message: response.message }, 'Zibal request failed');
      } else {
        logger.info({ trackId: response.trackId }, 'Zibal request successful');
      }

      return response as ZibalResponse;
    } catch (error) {
      logger.error({ error }, 'Zibal request exception');
      throw error;
    }
  }

  async verify(options: ZibalVerifyOptions): Promise<ZibalResponse> {
    const start = process.hrtime();
    logger.info({ trackId: options.trackId }, 'Verifying Zibal payment');

    try {
      const response = await this.zibal.verify(options);
      const duration = process.hrtime(start);
      paymentLatency.labels('zibal', 'verify').observe(duration[0] + duration[1] / 1e9);

      if (response.result !== 100) {
        logger.error({ result: response.result, message: response.message, trackId: options.trackId }, 'Zibal verification failed');
      } else {
        logger.info({ trackId: options.trackId, result: response.result }, 'Zibal verification successful');
      }

      return response as ZibalResponse;
    } catch (error) {
      logger.error({ error, trackId: options.trackId }, 'Zibal verify exception');
      throw error;
    }
  }
}

export const zibalProvider = new ZibalProvider();
