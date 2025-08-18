import {
  Injectable,
  Logger,
  InternalServerErrorException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';

@Injectable()
export class MessageService {
  private readonly logger = new Logger(MessageService.name);
  private smsServiceEnabled: boolean | undefined;

  constructor(private readonly configService: ConfigService) { }

  async sendSMS(phone: string, body: string): Promise<void> {
    this.smsServiceEnabled = this.configService.get<boolean>(
      'SMS_SERVICE_ENABLED',
    );
    const smsUrl = this.configService.get<string>('SMS_API_URL');
    if (!smsUrl) {
      throw new Error('SMS_API_URL is not defined in environment variables');
    }

    const payload = {
      to: phone,
      body: `${body}`,
      // body: `Your OTP is: ${otp}. Please do not share it with anyone. It will expire in 10 minutes.`,
    };

    try {
      if (this.smsServiceEnabled) {
        const response = await axios.post(smsUrl, payload, {
          headers: this.smsHeaders,
        });
        this.logger.log(
          `SMS sent to ${phone}, response code: ${response.status}`,
        );
      } else {
        this.logger.log(`SMS is disabled. Skip to sened sms to ${phone}`);
      }
    } catch (error) {
      this.logger.error(
        `Failed to send SMS to ${phone}: ${error.message}`,
        error.stack,
      );
      if (error.response?.data) {
        this.logger.error(
          `BulkSMS response: ${JSON.stringify(error.response.data)}`,
        );
      }
    }
  }

  private get smsHeaders() {
    return {
      'Content-Type': 'application/json',
      Authorization: this.configService.get<string>('BULKSMS_AUTH_HEADER'),
    };
  }
}
