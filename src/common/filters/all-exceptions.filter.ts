import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from "@nestjs/common";
import { HttpAdapterHost } from "@nestjs/core";
import { PrismaClientKnownRequestError } from "@prisma/client/runtime/library";

import { JwtService } from "@nestjs/jwt";
import { ApiResponse } from "../interfaces/api-response.interface";
import { WinstonLoggerService } from "../winston-logger/winston-logger.service";
import { log } from "console";

@Catch()
export class AllExceptionsFilter<T> implements ExceptionFilter {
  //private readonly logger = new Logger(AllExceptionsFilter.name);

  constructor(
    private readonly httpAdapterHost: HttpAdapterHost,
    private jwtService: JwtService,
    private readonly logger: WinstonLoggerService
  ) {}
  catch(exception: T, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const { httpAdapter } = this.httpAdapterHost;
    const response = ctx.getResponse<Response>();

    let statusCode = HttpStatus.INTERNAL_SERVER_ERROR;
    let message = "Internal server error";
    let error: string | Record<string, any> = "An unexpected error occurred";

    // Handle different types of exceptions
    if (exception instanceof HttpException) {
      statusCode = exception.getStatus();
      const exceptionResponse = exception.getResponse();

      if (typeof exceptionResponse === "object" && exceptionResponse !== null) {
        message = (exceptionResponse as any).message || exception.message;
        error = (exceptionResponse as any).error || exception.message;
      } else {
        message = exception.message;
      }
    } else if (exception instanceof PrismaClientKnownRequestError) {
      statusCode = HttpStatus.BAD_REQUEST;

      switch (exception.code) {
        case "P2002":
          message = "Unique constraint violation";
          error = `Duplicate field value: ${exception.meta?.target}`;
          break;
        case "P2025":
          message = "Record not found";
          statusCode = HttpStatus.NOT_FOUND;
          break;
        case "P2003":
          message = "Foreign key constraint failed";
          error = `Related record not found: ${exception.meta?.target}`;
          break;
        default:
          message = `Database error: ${exception.code}`;
          error = exception.message;
      }
    } else if (
      exception instanceof Error &&
      exception.name === "PrismaClientValidationError"
    ) {
      statusCode = HttpStatus.BAD_REQUEST;
      message = "Validation error";
      error = exception.message.replace(/\n/g, "");
    } else if (exception instanceof Error) {
      if (exception.message.includes("jwt")) {
        // Handle JWT specific errors
        statusCode = HttpStatus.UNAUTHORIZED;
        message = "Authentication error";

        if (exception.message.includes("expired")) {
          error = "JWT token has expired";
        } else if (exception.message.includes("malformed")) {
          error = "Invalid JWT token format";
        } else {
          error = "JWT authentication failed";
        }
      } else {
        error = exception.message;
      }
    }

    const apiResponse: ApiResponse<null> = {
      success: false,
      statusCode,
      message,
      error,
      timestamp: new Date().toISOString(),
    };

    const errorMessage =
      exception instanceof Error
        ? exception.stack
        : apiResponse?.error
        ? typeof apiResponse.error === "string"
          ? apiResponse.error
          : JSON.stringify(apiResponse.error)
        : undefined;

    this.logger.error(
      `${statusCode} - ${apiResponse?.message || "Unknown error"}`,
      errorMessage
    );

    httpAdapter.reply(response, apiResponse, statusCode);
  }
  private getPrismaErrorMessage(
    exception: PrismaClientKnownRequestError
  ): string {
    switch (exception.code) {
      case "P2002":
        return `Unique constraint failed on the field: ${
          exception.meta?.target as string
        }`;
      case "P2025":
        return "Record not found";
      default:
        return `Database error: ${exception.message}`;
    }
  }
}
