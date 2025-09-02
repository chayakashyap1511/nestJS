import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Mailgun from 'mailgun.js';
import * as FormData from 'form-data';

@Injectable()
export class MailGunEmailService {
  private readonly logger = new Logger(MailGunEmailService.name);
  private mg: ReturnType<typeof Mailgun.prototype.client>;
  private domain: string;
  private emailServiceEnabled: boolean | undefined;

  constructor(private readonly configService: ConfigService) {
    this.emailServiceEnabled = this.configService.get<boolean>(
      'EMAIL_SERVICE_ENABLED',
    );

    const mailgunApiKey = this.configService.get<string>('MAILGUN_API_KEY');
    const mailgunDomain = this.configService.get<string>('MAILGUN_DOMAIN');

    if (!mailgunApiKey || !mailgunDomain) {
      this.logger.error(
        'MAILGUN_API_KEY or MAILGUN_DOMAIN not found in environment variables',
      );
      throw new Error('Missing Mailgun API Key or Domain');
    }

    this.domain = mailgunDomain;

    const mailgun = new Mailgun(FormData);
    this.mg = mailgun.client({
      username: 'api',
      key: mailgunApiKey,
    });
  }

  async sendEmail(
    to: string,
    subject: string,
    text: string,
    html: string,
  ): Promise<boolean> {
    const fromEmail = this.configService.get<string>('EMAIL_FROM');

    if (!fromEmail) {
      throw new Error('EMAIL_FROM is not defined in the environment variables');
    }

    const msg = {
      to,
      from: fromEmail,
      subject,
      html: html || text,
    };

    try {
      if (this.emailServiceEnabled) {
        await this.mg.messages.create(this.domain, msg);
        this.logger.log(`Email sent to ${to}`);
      } else {
        this.logger.warn(`Email sending is disabled. Skipping email to ${to}`);
      }
      return true;
    } catch (error) {
      this.logger.error(`Failed to send email: ${error.message}`, error.stack);
      return false;
    }
  }
}
