import { PassportStrategy } from "@nestjs/passport";
import { Injectable } from "@nestjs/common";
import { Strategy, Profile } from "passport-facebook";
import { ConfigService } from "@nestjs/config";

@Injectable()
export class FacebookStrategy extends PassportStrategy(Strategy, "facebook") {
  constructor(configService: ConfigService) {
    super({
      clientID: configService.get("FACEBOOK_APP_ID"),
      clientSecret: configService.get("FACEBOOK_APP_SECRET"),
      callbackURL: configService.get("FACEBOOK_CALLBACK_URL"),
      profileFields: ["id", "emails", "name", "photos"],
      scope: ["email"],
    });
  }

  async validate(
    accessToken: string,
    refreshToken: string,
    profile: Profile,
    done: Function
  ): Promise<any> {
    const { name, emails, photos } = profile;
    const user = {
      email: emails?.[0]?.value,
      firstName: name.givenName,
      lastName: name.familyName,
      fullName: name.givenName + " " + name.familyName,
      picture: photos?.[0]?.value,
      provider: "facebook",
      providerId: profile.id,
    };
    done(null, user);
  }
}
