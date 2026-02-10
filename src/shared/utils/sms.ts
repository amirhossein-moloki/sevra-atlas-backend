export interface ISmsProvider {
  sendOtp(phoneNumber: string, code: string): Promise<void>;
}

export class MockSmsProvider implements ISmsProvider {
  async sendOtp(phoneNumber: string, code: string): Promise<void> {
    console.log(`[SMS MOCK] Sending OTP ${code} to ${phoneNumber}`);
  }
}

export class KavenegarSmsProvider implements ISmsProvider {
  constructor(private apiKey: string) {
    if (!apiKey) {
      console.warn('⚠️ Kavenegar API Key is missing. SMS delivery will fail.');
    }
  }

  async sendOtp(phoneNumber: string, code: string): Promise<void> {
    console.log(`[Kavenegar] Attempting to send OTP to ${phoneNumber}`);

    if (!this.apiKey || this.apiKey === 'mock-key') {
      console.log(`[Kavenegar] [MOCK MODE] OTP ${code} would be sent to ${phoneNumber}`);
      return;
    }

    try {
      // Real API call using native fetch (Node 18+)
      const url = `https://api.kavenegar.com/v1/${this.apiKey}/verify/lookup.json?receptor=${phoneNumber}&token=${code}&template=verify`;

      const response = await fetch(url);
      const data = await response.json() as any;

      if (!response.ok) {
        throw new Error(`Kavenegar API error: ${response.status} ${response.statusText} - ${JSON.stringify(data)}`);
      }

      console.info(`[Kavenegar] Successfully sent SMS to ${phoneNumber}. Message ID: ${data.entries?.[0]?.messageid}`);
    } catch (error) {
      console.error(`[Kavenegar] CRITICAL: Failed to send SMS to ${phoneNumber}:`, error);
      throw error;
    }
  }
}

import { env } from '../../shared/config/env';

export const smsProvider: ISmsProvider = env.SMS_PROVIDER === 'kavenegar' 
  ? new KavenegarSmsProvider(env.SMS_API_KEY || '') 
  : new MockSmsProvider();
