import { Injectable } from '@nestjs/common';
import { ConfigService as NestConfigService } from '@nestjs/config';

@Injectable()
export class AppConfigService extends NestConfigService {

  get corsOrigin(): string {
    return this.get<string>('CORS_ORIGIN', '*');
  }

  get port(): number {
    return this.get<number>('PORT', 3000);
  }


}
