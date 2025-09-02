import { Module } from '@nestjs/common';
import { MailGunEmailService } from './mailgun-email.service';

@Module({
  providers: [MailGunEmailService],
  exports: [MailGunEmailService],
})
export class MailGunEmailModule { }
