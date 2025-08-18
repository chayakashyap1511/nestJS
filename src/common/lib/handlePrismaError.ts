// src/common/utils/handlePrismaError.ts

import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  InternalServerErrorException,
  NotFoundException,
} from "@nestjs/common";
import { Prisma } from "@prisma/client";

export function handlePrismaError(error: any, context = "Operation") {
  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    switch (error.code) {
      case "P2000":
        // Value too long for column
        throw new BadRequestException(
          `${context} failed: Value too long for a field`
        );

      case "P2001":
        // Record not found
        throw new NotFoundException(`${context} failed: Record not found`);

      case "P2002":
        // Unique constraint failed
        throw new ConflictException(`${context} failed: Duplicate field value`);

      case "P2003":
        // Foreign key constraint failed
        throw new BadRequestException(
          `${context} failed: Foreign key constraint failed`
        );

      case "P2004":
        // Constraint failed on database
        throw new BadRequestException(
          `${context} failed: A database constraint failed`
        );

      case "P2005":
        // Invalid value for a field
        throw new BadRequestException(
          `${context} failed: Invalid value for a field`
        );

      case "P2006":
        // Missing required field
        throw new BadRequestException(
          `${context} failed: Missing required field`
        );

      case "P2007":
        // Data validation error
        throw new BadRequestException(
          `${context} failed: Data validation error`
        );

      case "P2010":
        // Raw query failed
        throw new InternalServerErrorException(
          `${context} failed: Raw query failed`
        );

      case "P2011":
        // Null constraint violation
        throw new BadRequestException(
          `${context} failed: Null value where not allowed`
        );

      case "P2012":
        // Missing required argument
        throw new BadRequestException(
          `${context} failed: Missing required argument`
        );

      case "P2013":
        // Missing relation
        throw new BadRequestException(`${context} failed: Missing relation`);

      case "P2014":
        // Relation violation
        throw new BadRequestException(
          `${context} failed: Relation constraint failed`
        );

      case "P2015":
        // Record not found
        throw new NotFoundException(
          `${context} failed: Related record not found`
        );

      case "P2016":
      case "P2017":
        // Query path error
        throw new BadRequestException(`${context} failed: Query path issue`);

      case "P2025":
        // Record to update/delete does not exist
        throw new NotFoundException(
          `${context} failed: Record to update/delete not found`
        );

      case "P2023":
        // Inconsistent column types
        throw new BadRequestException(
          `${context} failed: Inconsistent column types`
        );

      default:
        // Unknown Prisma error
        throw new InternalServerErrorException(
          `${context} failed: ${error.message}`
        );
    }
  }

  // Any other error (non-Prisma)
  throw new InternalServerErrorException(`${context} failed`);
}
