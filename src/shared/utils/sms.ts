export interface ISmsProvider {
  sendOtp(phoneNumber: string, code: string): Promise<void>;
}

export class MockSmsProvider implements ISmsProvider {
  async sendOtp(phoneNumber: string, code: string): Promise<void> {
    console.log(`[SMS MOCK] Sending OTP ${code} to ${phoneNumber}`);
  }
}

export class KavenegarSmsProvider implements ISmsProvider {
  constructor(private apiKey: string) {}
  async sendOtp(phoneNumber: string, code: string): Promise<void> {
    console.log(`[Kavenegar] Sending OTP ${code} to ${phoneNumber} (API Key: ${this.apiKey})`);
    // Implementation would go here
  }
}

import { env } from '../../shared/config/env';

export const smsProvider: ISmsProvider = env.SMS_PROVIDER === 'kavenegar' 
  ? new KavenegarSmsProvider(env.SMS_API_KEY || '') 
  : new MockSmsProvider();
