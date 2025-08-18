import { Module } from '@nestjs/common';
import { ConfigModule as NestConfigModule } from '@nestjs/config';
import { AppConfigService } from './config.service';
import { validationSchema } from './config.validation';

@Module({
  imports: [
    NestConfigModule.forRoot({
      isGlobal: true,
      validationSchema,
      validationOptions: {
        abortEarly: true,       // Stop on the first validation error (useful for dev)
        allowUnknown: true,     // Allows extra env vars not listed in schema
      },
    }),
  ],
  providers: [AppConfigService],
  exports: [NestConfigModule, AppConfigService],
})

export class ConfigModule { }
