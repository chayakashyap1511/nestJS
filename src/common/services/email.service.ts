import { Injectable, Logger } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import * as sgMail from "@sendgrid/mail";

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);

  private emailServiceEnabled: boolean | undefined;

  constructor(private readonly configService: ConfigService) {
    this.emailServiceEnabled = this.configService.get<boolean>(
      "EMAIL_SERVICE_ENABLED"
    );

    const apiKey = this.configService.get<string>("SENDGRID_API_KEY");

    if (!apiKey) {
      this.logger.error("SENDGRID_API_KEY not found in environment variables");
      throw new Error("Missing SendGrid API Key");
    }
    sgMail.setApiKey(apiKey);
  }

  async sendEmail(
    to: string,
    subject: string,
    text: string,
    html: string
  ): Promise<boolean> {
    const fromEmail = this.configService.get<string>("EMAIL_FROM");

    if (!fromEmail) {
      throw new Error("EMAIL_FROM is not defined in the environment variables");
    }

    const msg = {
      to,
      from: fromEmail,
      subject,
      html: html || text,
    };

    try {
      if (this.emailServiceEnabled) {
        await sgMail.send(msg);
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
