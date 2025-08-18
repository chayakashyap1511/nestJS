import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from "@nestjs/common";
import { Observable } from "rxjs";
import { map } from "rxjs/operators";
import { ApiResponse } from "../interfaces/api-response.interface";

@Injectable()
export class TransformInterceptor<T>
  implements NestInterceptor<T, ApiResponse<T>>
{
  intercept(
    context: ExecutionContext,
    next: CallHandler
  ): Observable<ApiResponse<T>> {
    const response = context.switchToHttp().getResponse();
    const statusCode = <number>response.statusCode;

    return next.handle().pipe(
      map((data: T) => ({
        success: statusCode >= 200 && statusCode < 300,
        statusCode,
        message:
          (data as any)?.message || this.getDefaultMessageForStatus(statusCode),
        data: this.stripMessage(data),
        timestamp: new Date().toISOString(),
      }))
    );
  }

  private getDefaultMessageForStatus(status: number): string {
    switch (status) {
      case 200:
        return "Request successful";
      case 201:
        return "Resource created successfully";
      case 204:
        return "Resource deleted successfully";
      default:
        return "Operation completed";
    }
  }

  private stripMessage(data: any): any {
    if (Array.isArray(data)) {
      return data;
    }

    if (data && typeof data === "object") {
      const { message, ...rest } = data;
      return rest;
    }

    return data;
  }
}
