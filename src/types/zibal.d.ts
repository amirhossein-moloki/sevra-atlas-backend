/**
 * Type definitions for zibal payment gateway
 */
declare module 'zibal' {
  interface ZibalConfig {
    merchant: string;
    callbackUrl?: string;
  }

  interface ZibalRequestOptions {
    amount: number;
    merchant?: string;
    callbackUrl?: string;
    orderId?: string;
    mobile?: string;
    description?: string;
    allowedCards?: string[];
    linkToPay?: boolean;
    sms?: boolean;
  }

  interface ZibalVerifyOptions {
    trackId: string | number;
    merchant?: string;
  }

  interface ZibalResponse {
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

  class Zibal {
    constructor(config: ZibalConfig);
    request(options: ZibalRequestOptions): Promise<ZibalResponse>;
    verify(options: ZibalVerifyOptions): Promise<ZibalResponse>;
  }

  export default Zibal;
}
