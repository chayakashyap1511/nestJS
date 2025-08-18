import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from "@nestjs/common";
import { UsersService } from "../users/users.service";
import { AppConfigService } from "../config/config.service";
import { JwtService } from "@nestjs/jwt";
import { RefreshTokenDto } from "./dto/refresh-token.dto";
import { RegisterDto } from "./dto/register.dto";
import { LoginDto } from "./dto/login.dto";
import { AccountType, User } from "@prisma/client";
import { SocialUser, UserToken } from '../types/common';
import * as sgMail from "@sendgrid/mail";
import { VerifyOtpDto } from "./dto/verifyOtp.dto";
import { ResetPasswordDto } from "./dto/resetPassword.dto";
import { ForgetPasswordDto } from "./dto/forgetPassword.dto";
import { PrismaService } from "src/prisma/prisma.service";
import { EmailService } from "src/common/services/email.service";
import {
  generateRegisterOtpEmailTemplate,
  generateResetPasswordOtpEmailTemplate,
} from "src/common/lib/email-sms-template";
import * as argon2 from "argon2";
import { ChangePasswordDto } from "./dto/changePassword.dto";
import { ResendOtpDto } from "./dto/resend-otp.dto";
import { OAuth2Client } from 'google-auth-library';

@Injectable()
export class AuthService {
  private oauthClient = new OAuth2Client({
    clientId: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    redirectUri: '',
  });

  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
    private configService: AppConfigService,
    private prisma: PrismaService,
    private emailService: EmailService,
  ) {
    sgMail.setApiKey(this.configService.get<string>("SENDGRID_API_KEY") || "");
  }

  async getUserFromCode(code: string): Promise<SocialUser> {
    const { tokens } = await this.oauthClient.getToken(code);
    const { id_token } = tokens;

    if (!id_token) {
      throw new UnauthorizedException(
        'Google authentication failed: Missing tokens',
      );
    }
    const ticket = await this.oauthClient.verifyIdToken({
      idToken: id_token,
      audience: process.env.GOOGLE_CLIENT_ID,
    });

    const payload = ticket.getPayload();

    if (!payload || !payload.sub || !payload.email || !payload.name) {
      throw new UnauthorizedException(
        'Google authentication failed: Invalid ID token payload',
      );
    }

    return {
      email: payload.email,
      fullName: payload.name,
      profilePic: payload.picture,
      providerId: payload.sub,
      provider: 'google',
    };
  }
  async validateUser(email: string, password: string): Promise<User> {
    const user = await this.usersService.findByEmail(email);

    if (!user) {
      throw new UnauthorizedException("Invalid credentials");
    }

    if (!user.isActive) {
      throw new ForbiddenException("Your account has been deactivated. Please contact support for assistance.");
    }

    if (!user.password) {
      throw new UnauthorizedException(
        "Password login not available for this account"
      );
    }

    const passwordIsValid = await this.usersService.verifyPassword(
      user.password,
      password
    );

    if (!passwordIsValid) {
      throw new UnauthorizedException("Invalid credentials");
    }

    return user;
  }

  async login(user: User, otp?: string) {
    const tokens = await this.getTokens(user.id, user.email, user.accountType);
    await this.usersService.updateRefreshToken(user.id, tokens.refreshToken);

    return {
      message: "Login successful",
      verified: user.isEmailVerified,
      otp: otp,
      user: {
        id: user.id,
        email: user.email,
        fullName: user.fullName,
        phone: user.phone,
        accountType: user.accountType,
        isEmailVerified: user.isEmailVerified,
      },
      ...tokens,
    };
  }

  async loginWithCredentials(loginDto: LoginDto) {
    loginDto.email = loginDto.email.toLowerCase();

    const user = await this.validateUser(loginDto.email, loginDto.password);

    let otp: string | undefined;
    let isVerified = user.isEmailVerified;


    if (!isVerified) {
      otp = await this.saveOtp(user.email);
      const html = generateRegisterOtpEmailTemplate(otp);
      await this.emailService.sendEmail(
        user.email,
        "Account Registration Verification Code",
        "",
        html
      );

      return {
        message: "Email not verified. OTP sent.",
        otpSent: true,
        verified: false,
        user: {
          id: user.id,
          email: user.email,
          fullName: user.fullName,
          accountType: user.accountType,
          isEmailVerified: user.isEmailVerified,
        },
      };
    }

    // Agar verified hai, token generate karo
    const tokens = await this.getTokens(user.id, user.email, user.accountType);
    await this.usersService.updateRefreshToken(user.id, tokens.refreshToken);

    return {
      message: "Login successful",
      verified: true,
      user: {
        id: user.id,
        email: user.email,
        fullName: user.fullName,
        accountType: user.accountType,
        isEmailVerified: user.isEmailVerified,
      },
      ...tokens,
    };
  }

  async resendOtp(resendOtpDto: ResendOtpDto) {
    const user = await this.usersService.findByEmail(resendOtpDto.email);

    if (!user) {
      throw new NotFoundException("User not found");
    }
    const otp = await this.saveOtp(user.email);
    const otpRecord = await this.prisma.otp.findFirst({
      where: { email: user.email },
      orderBy: { createdAt: 'desc' },
    });

    const expiresAt = otpRecord ? otpRecord.expiresAt : null;

    const html = generateRegisterOtpEmailTemplate(otp);
    await this.emailService.sendEmail(
      user.email,
      "Verification Code",
      "",
      html
    );
    return {
      message: "OTP sent successfully to your email address",
      otp: otp,
      otpExpire: expiresAt,
    };
  }

  async register(registerDto: RegisterDto) {
    const user = await this.usersService.create(registerDto);

    const otp = await this.saveOtp(user.email);
    const otpRecord = await this.prisma.otp.findFirst({
      where: { email: user.email },
      orderBy: { createdAt: 'desc' },
    });


    const expiresAt = otpRecord ? otpRecord.expiresAt : null;

    const html = generateRegisterOtpEmailTemplate(otp);
    await this.emailService.sendEmail(
      user.email,
      "Verify your account",
      "",
      html
    );

    // const tokens = await this.getTokens(user.id, user.email, user.accountType);
    // await this.usersService.updateRefreshToken(user.id, tokens.refreshToken);

    return {
      message: "Registration successful. OTP sent to email.",
      otp: otp,
      otpExpire: expiresAt,
      user: {
        id: user.id,
        fullName: user.fullName,
        email: user.email,
        phone: user.phone,
        accountType: user.accountType,
        isEmailVerified: user.isEmailVerified,
      },
      // ...tokens,
    };
  }

  async refreshTokens(refreshTokenDto: RefreshTokenDto) {
    try {
      const { refreshToken } = refreshTokenDto;
      const payload = this.jwtService.verify<UserToken>(refreshToken, {
        secret: this.configService.get<string>("JWT_REFRESH_SECRET"),
      }) as User;

      const user = await this.usersService.findByEmail(payload.email);

      if (!user || !user.refreshToken) {
        throw new ForbiddenException("Access denied");
      }

      const refreshTokenMatches = await this.usersService.verifyPassword(
        user.refreshToken,
        refreshToken
      );

      if (!refreshTokenMatches) {
        throw new ForbiddenException("Access denied");
      }

      const tokens = await this.getTokens(
        user.id,
        user.email,
        user.accountType
      );
      await this.usersService.updateRefreshToken(user.id, tokens.refreshToken);

      return tokens;
    } catch (error) {
      throw new ForbiddenException("Invalid refresh token");
    }
  }

  private async getTokens(
    userId: string,
    email: string,
    accountType: AccountType
  ) {
    const [accessToken, refreshToken] = await Promise.all([
      this.jwtService.signAsync(
        {
          sub: userId,
          email,
          accountType,
        },
        {
          secret: this.configService.get<string>("JWT_SECRET"),
          expiresIn: this.configService.get<string>("JWT_EXPIRES_IN"),
        }
      ),
      this.jwtService.signAsync(
        {
          sub: userId,
          email,
          accountType,
        },
        {
          secret: this.configService.get<string>("JWT_REFRESH_SECRET"),
          expiresIn: this.configService.get<string>("JWT_REFRESH_EXPIRES_IN"),
        }
      ),
    ]);

    return {
      accessToken,
      refreshToken,
    };
  }

  async sendResetOtp(forgetPasswordDto: ForgetPasswordDto) {
    const user = await this.usersService.findByEmail(
      forgetPasswordDto.email,
    );
    const { email } = forgetPasswordDto;

    if (!user) {
      throw new NotFoundException("User not found");
    }

    const otp = await this.saveOtp(email);

    if (email) {
      const html = generateResetPasswordOtpEmailTemplate(otp);
      await this.emailService.sendEmail(
        email,
        "Reset Password Verification Code",
        "",
        html
      );
    } else {
      throw new NotFoundException("Email not found");
    }

    return { message: "OTP sent to " + (email), otp };
  }

  async saveOtp(email: string) {
    // const otp = generateCode();
    const otp = '1234';

    const expiresAt = new Date();
    expiresAt.setMinutes(expiresAt.getMinutes() + 10);

    const existingOtp = await this.prisma.otp.findFirst({
      where: {
        email,
      },
    });

    if (existingOtp) {
      await this.prisma.otp.delete({
        where: {
          id: existingOtp.id,
        },
      });
    }

    await this.prisma.otp.create({
      data: {
        email,
        otp,
        expiresAt,
      },
    });

    return otp;
  }

  async verifyOtp(verifyOtpDto: VerifyOtpDto) {
    const user = await this.usersService.findByEmail(
      verifyOtpDto.email,
    );

    if (!user) {
      throw new NotFoundException("User not found");
    }

    const otp = await this.prisma.otp.findFirst({
      where: {
        email: verifyOtpDto.email,
        otp: verifyOtpDto.otp,
        expiresAt: { gt: new Date() },
      },
    });

    if (!otp) {
      throw new BadRequestException("Invalid or Expired OTP");
    }

    if (!user.isEmailVerified) {
      await this.usersService.updateEmailVerified(user.id, true);
      user.isEmailVerified = true;
    }

    await this.prisma.otp.delete({
      where: {
        id: otp.id,
      },
    });

    const tokens = await this.getTokens(user.id, user.email, user.accountType);
    await this.usersService.updateRefreshToken(user.id, tokens.refreshToken);

    return {
      message: "OTP verified successfully",
      user: {
        id: user.id,
        email: user.email,
        fullName: user.fullName,
        phone: user.phone,
        isEmailVerified: user.isEmailVerified,
      },
      ...tokens,
    };
  }

  async resetPassword(resetPasswordDto: ResetPasswordDto) {
    //verify otp
    const otp = await this.prisma.otp.findFirst({
      where: {
        email: resetPasswordDto.email,
        otp: resetPasswordDto.otp,
        expiresAt: { gt: new Date() },
      },
    });

    if (!otp) {
      throw new BadRequestException("Invalid or Expired OTP");
    }

    const user = await this.usersService.findByEmail(
      resetPasswordDto.email,
    );

    if (!user) {
      throw new NotFoundException("User not found");
    }

    if (!user.password) {
      throw new UnauthorizedException(
        "Password login not available for this account"
      );
    }

    // Check if new password is same as old password
    const isSamePassword = await argon2.verify(
      user.password,
      resetPasswordDto.newPassword
    );

    if (isSamePassword) {
      throw new BadRequestException(
        "New password must be different from the current password"
      );
    }

    const hashedPassword = await argon2.hash(resetPasswordDto.newPassword);

    //update password
    await this.prisma.user.update({
      where: {
        id: user.id,
      },
      data: {
        password: hashedPassword,
      },
    });

    //delete otp after verify
    await this.prisma.otp.delete({
      where: {
        id: otp.id,
      },
    });

    return { message: "Password reset successfully" };
  }

  async changePassword(changePasswordDto: ChangePasswordDto, id: string) {
    const user = await this.prisma.user.findFirst({
      where: { id },
    });

    if (!user) {
      throw new NotFoundException("User not found");
    }

    if (!user.password) {
      throw new BadRequestException(
        "Password login not available for this account"
      );
    }

    const valid = await this.usersService.verifyPassword(
      user.password,
      changePasswordDto.currentPassword
    );

    if (!valid) {
      throw new BadRequestException("Current password is incorrect");
    }

    const isSamePassword = await argon2.verify(
      user.password,
      changePasswordDto.newPassword
    );

    if (isSamePassword) {
      throw new BadRequestException(
        "New password must be different from the current password"
      );
    }

    const hashedPassword = await argon2.hash(changePasswordDto.newPassword);

    await this.prisma.user.update({
      where: { id },
      data: {
        password: hashedPassword,
      },
    });

    return { message: "Password Change Successfully." };
  }

  async socialLogin(socialUser: SocialUser) {
    let user = await this.usersService.findByEmail(socialUser.email);
    if (!user) {
      user = await this.usersService.createSocialUser(socialUser);
    }

    const tokens = await this.getTokens(user.id, user.email, user.accountType);
    await this.usersService.updateRefreshToken(user.id, tokens.refreshToken);

    return {
      message: "Registration & Login successful",
      verified: user.isEmailVerified,
      user: {
        id: user.id,
        email: user.email,
        fullName: user.fullName,
        phone: user.phone,
        accountType: user.accountType,
        isEmailVerified: user.isEmailVerified,
      },
      ...tokens,
    };
  }
}