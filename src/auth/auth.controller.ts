import {
  BadRequestException,
  Body,
  Controller,
  Get,
  NotFoundException,
  Patch,
  Post,
  Req,
  UploadedFile,
  UseInterceptors,
  Headers,
  UseGuards,
  Catch,
  ExceptionFilter,
  ArgumentsHost,
  UseFilters,
  UnauthorizedException,
} from '@nestjs/common';
import { RefreshTokenDto } from "./dto/refresh-token.dto";
import { AuthService } from "./auth.service";
import { RegisterDto } from "./dto/register.dto";
import { LoginDto } from "./dto/login.dto";
import { Request } from "express";
import { ForgetPasswordDto } from "./dto/forgetPassword.dto";
import { VerifyOtpDto } from "./dto/verifyOtp.dto";
import { ResetPasswordDto } from "./dto/resetPassword.dto";
import { UsersService } from "src/users/users.service";
import { ProfileUpdateDto } from "./dto/profileUpdate.dto";
import { FileInterceptor } from "@nestjs/platform-express";
import { diskStorage } from "multer";
import { extname } from "path";
import { Express } from "express";
import { ConfigService } from "@nestjs/config";
import { existsSync, mkdirSync, unlinkSync } from "fs";
import { Public } from "src/common/decorators/public.decorator";
import { ChangePasswordDto } from "./dto/changePassword.dto";
import { BlacklistService } from "src/blacklist/blacklist.service";
import { AuthGuard } from "@nestjs/passport";
import { handlePrismaError } from "src/common/lib/handlePrismaError";
import { ResendOtpDto } from "./dto/resend-otp.dto";
import { DeleteUploadedFileInterceptor } from 'src/common/interceptors/delete-uploaded-file.interceptor';
import { deleteFile } from 'src/common/utils/file-upload.utils';

@Catch(BadRequestException)
export class FileCleanupFilter implements ExceptionFilter {
  constructor(private readonly configService: ConfigService) { }
  catch(exception: BadRequestException, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const req = ctx.getRequest<Request & { file?: Express.Multer.File }>();
    if (req.file) {
      if (existsSync(req.file.path)) {
        unlinkSync(req.file.path);
      }
    }
    throw exception;
  }
}

@Controller("auth")
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly userService: UsersService,
    private configService: ConfigService,
    private blacklistService: BlacklistService
  ) { }

  @Public()
  @Post("register")
  register(@Body() registerDto: RegisterDto) {
    return this.authService.register(registerDto);
  }


  @Public()
  @Post("login")
  login(@Body() loginDto: LoginDto) {
    return this.authService.loginWithCredentials(loginDto);
  }

  @Public()
  @Post("resend-otp")
  resend(@Body() resendOtpDto: ResendOtpDto) {
    return this.authService.resendOtp(resendOtpDto);
  }

  @Post("refresh")
  refreshTokens(@Body() refreshTokenDto: RefreshTokenDto) {
    return this.authService.refreshTokens(refreshTokenDto);
  }

  @Public()
  @Get("google")
  @UseGuards(AuthGuard("google"))
  async googleAuth() { }

  @Public()
  @Get("google/redirect")
  @UseGuards(AuthGuard("google"))
  async googleAuthRedirect(@Req() req) {
    return this.authService.socialLogin(req.user);
  }

  @Public()
  @Post("google/login")
  async googleAuthLogin(@Body("code") code: string) {
    if (!code) {
      throw new UnauthorizedException(
        'Google authentication failed: Missing server authorization code'
      );
    }
    const socialUser = await this.authService.getUserFromCode(code);
    return this.authService.socialLogin(socialUser);
  }

  @Public()
  @Get("facebook")
  @UseGuards(AuthGuard("facebook"))
  async facebookAuth() { }

  @Public()
  @Get("facebook/redirect")
  @UseGuards(AuthGuard("facebook"))
  async facebookAuthRedirect(@Req() req) {
    return this.authService.socialLogin(req.user);
  }

  @Post("logout")
  logout(@Headers("authorization") authHeader: string) {
    const token = authHeader?.replace("Bearer ", "");
    this.blacklistService.add(token);
    return { message: "Logged out successfully" };
  }

  @Get("profile")
  getProfile(@Req() req: Request) {
    const userId = req.user?.sub;
    if (!userId) {
      throw new NotFoundException("User ID not Found");
    }
    return this.userService.findOne(userId);
  }

  @Patch("profile")
  @UseInterceptors(
    FileInterceptor('profilePic', {
      storage: diskStorage({

        destination: (req, file, cb) => {
          const uploadPath = './uploads/profilePics';
          if (!existsSync(uploadPath)) {
            mkdirSync(uploadPath, { recursive: true });
          }
          cb(null, uploadPath);
        },
        filename: (req, file, callback) => {
          const fileExtension = extname(file.originalname);
          const filename = `${Date.now()}${fileExtension}`;
          callback(null, filename);
        },
      }),
      fileFilter: (req, file, cb) => {
        const allowedTypes = ["image/png", "image/jpg", "image/jpeg"];
        if (!allowedTypes.includes(file.mimetype)) {
          return cb(new BadRequestException("Invalid file type"), false);
        }
        cb(null, true);
      },
      limits: {
        fileSize: 1024 * 1024 * 5,
      },

    }),
    DeleteUploadedFileInterceptor,
  )
  async update(
    @Req() req: Request,
    @Body() profileUpdateDto: ProfileUpdateDto,
    @UploadedFile() file: Express.Multer.File,
  ) {
    const userId = req.user?.sub;

    if (!userId) {
      throw new NotFoundException("User ID not Found");
    }
    const existingrecord = await this.userService.findOne(userId);
    if (file) {
      if (existingrecord.profilePic) {
        deleteFile(existingrecord.profilePic);
      }
      profileUpdateDto.profilePic = file.path;
    }
    return this.userService.updateprofile(userId, profileUpdateDto);
  }


  @Public()
  @Post("forget-password")
  forgetPassword(@Body() forgetPasswordDto: ForgetPasswordDto) {
    const { email } = forgetPasswordDto;

    if (!email) {
      throw new BadRequestException("Email field is required");
    }

    return this.authService.sendResetOtp(forgetPasswordDto);
  }

  @Public()
  @Post("reset-password")
  ResetPassword(@Body() resetPasswordDto: ResetPasswordDto) {
    const { email } = resetPasswordDto;

    if (!email) {
      throw new BadRequestException("Email is required");
    }

    return this.authService.resetPassword(resetPasswordDto);
  }

  @Public()
  @Post("verify-otp")
  async verifyOtp(@Body() dto: VerifyOtpDto) {
    const { email } = dto;

    if (!email) {
      throw new BadRequestException("Email field is required");
    }

    return this.authService.verifyOtp(dto);
  }

  @Post("change-password")
  changePassword(@Body() changePasswordDto: ChangePasswordDto, @Req() req) {
    const userId = req.user.sub;
    return this.authService.changePassword(changePasswordDto, userId);
  }
}
