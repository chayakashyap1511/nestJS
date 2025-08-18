import {
  IsEmail,
  IsOptional,
} from 'class-validator';

export class ForgetPasswordDto {
  @IsEmail()
  @IsOptional()
  email: string;
}
