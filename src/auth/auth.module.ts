import { Module } from '@nestjs/common';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { UsersModule } from '../users/users.module';
import { JwtModule } from '@nestjs/jwt';
import { JwtStrategy } from './strategies/jwt.strategy';
import { jwtConstants } from './constants';
import { AppConfigService } from '../config/config.service';
import { EmailModule } from 'src/common/services/email.module';
import { BlacklistModule } from 'src/blacklist/blacklist.module';
import { MailGunEmailModule } from 'src/common/services/mailgun-email.module';

@Module({
  imports: [
    BlacklistModule,
    UsersModule,
    JwtModule.register({
      secret: jwtConstants.secret,
      signOptions: {
        expiresIn: jwtConstants.expiresIn,
      },
    }),
    EmailModule,
    MailGunEmailModule,
  ],
  controllers: [AuthController],
  providers: [AuthService, JwtStrategy, AppConfigService],
  exports: [AuthService, JwtModule],
})
export class AuthModule { }
