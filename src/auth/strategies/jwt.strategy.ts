import { ExtractJwt, Strategy } from 'passport-jwt';
import { PassportStrategy } from '@nestjs/passport';
import { Injectable } from '@nestjs/common';
import { AppConfigService } from '../../config/config.service';
import { UserToken } from '../../types/common';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(private configService: AppConfigService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.get<string>('JWT_SECRET', 'jwt-secret-key'),
    });
  }

  validate(payload: UserToken) {
    return {
      sub: payload.sub,
      email: payload.email,
      accountType: payload.accountType,
    };
  }
}
