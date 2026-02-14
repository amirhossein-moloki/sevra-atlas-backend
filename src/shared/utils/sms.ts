import { Smsir } from 'sms-typescript';
import { config } from '../../config';

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

export class SmsirProvider implements ISmsProvider {
  private smsir: Smsir;
  private templateId: number;

  constructor(apiKey: string, lineNumber: number, templateId: number) {
    this.smsir = new Smsir(apiKey, lineNumber);
    this.templateId = templateId;
    if (!apiKey || !lineNumber || !templateId) {
      console.warn('⚠️ SMS.ir configuration is incomplete. SMS delivery may fail.');
    }
  }

  async sendOtp(phoneNumber: string, code: string): Promise<void> {
    console.log(`[SMS.ir] Attempting to send OTP to ${phoneNumber}`);

    try {
      const result = await this.smsir.sendVerifyCode(phoneNumber, this.templateId, [
        { name: 'Code', value: code },
      ]);

      if (result.status !== 1) {
        throw new Error(`SMS.ir API error: ${result.message}`);
      }

      console.info(`[SMS.ir] Successfully sent OTP to ${phoneNumber}.`);
    } catch (error) {
      console.error(`[SMS.ir] CRITICAL: Failed to send OTP to ${phoneNumber}:`, error);
      throw error;
    }
  }
}

const getSmsProvider = (): ISmsProvider => {
  switch (config.sms.provider) {
    case 'kavenegar':
      return new KavenegarSmsProvider(config.sms.apiKey || '');
    case 'smsir':
      return new SmsirProvider(
        config.sms.smsir.apiKey || '',
        config.sms.smsir.lineNumber || 0,
        config.sms.smsir.templateId || 0
      );
    default:
      return new MockSmsProvider();
  }
};

export const smsProvider: ISmsProvider = getSmsProvider();
