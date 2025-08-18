import { AccountType } from "@prisma/client";
import {
  IsEmail,
  IsEnum,
  IsIn,
  IsNotEmpty,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
  MinLength,
} from "class-validator";

export class CreateUserDto {
  @IsString()
  @IsNotEmpty()
  fullName: string;

  @IsIn([
    AccountType.SUPERADMIN,
    AccountType.USER
  ])
  @IsOptional()
  accountType?: AccountType;

  @IsEmail()
  @IsNotEmpty()
  email: string;

  @IsNotEmpty()
  @Matches(/^\d{10}$/, {
    message: "Phone number must be exactly 10 digits",
  })
  phone: string;

  @IsString()
  @IsNotEmpty()
  @MinLength(6)
  @MaxLength(20)
  @Matches(/^(?=.*[A-Za-z])(?=.*\d)(?=.*[^A-Za-z\d])[A-Za-z\d\S]{6,20}$/, {
    message:
      "Password must contain at least one letter, one number and one special character",
  })
  password: string;
}
