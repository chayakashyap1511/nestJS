import {
  IsDate,
  IsEmail,
  IsNotEmpty,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
  MinLength,
} from "class-validator";
import { Type } from "class-transformer";

export class UpdateUserDto {
  @IsString()
  @IsNotEmpty()
  fullName: string;

  @IsEmail()
  @IsNotEmpty()
  email: string;

  @IsNotEmpty()
  @Matches(/^\d{10}$/, {
    message: "Phone number must be exactly 10 digits",
  })
  phone: string;

  @IsString()
  @IsOptional()
  @MinLength(6)
  @MaxLength(20)
  @Matches(/^(?=.*[A-Za-z])(?=.*\d)(?=.*[^A-Za-z\d])[A-Za-z\d\S]{6,20}$/, {
    message:
      "Password must contain at least one letter, one number and one special character",
  })
  password: string;

  @IsOptional()
  @IsDate()
  @Type(() => Date)
  dateOfBirth: Date | string;

  @IsString()
  @IsOptional()
  gender: string;

  @IsString()
  @IsOptional()
  currentCity: string;

  @IsString()
  @IsOptional()
  description: string;

  @IsString()
  @IsOptional()
  profilePic: string;
}
