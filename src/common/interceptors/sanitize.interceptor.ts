import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from "@nestjs/common";
import { Observable } from "rxjs";
import { map } from "rxjs/operators";
import * as sanitizeHtml from "sanitize-html";

@Injectable()
export class SanitizeInterceptor implements NestInterceptor {

  private excludedPaths: string[] = ['/privacy-policy'];

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest();

     if (this.isExcluded(request)) {
      return next.handle();
    }

    if (request.body) {
      request.body = this.sanitizeObject(request.body);
    }

    return next.handle().pipe(map((data) => data));
  }

  private sanitizeObject(input: unknown): any {
    // Handle arrays
    if (Array.isArray(input)) {
      return input.map((item) => this.sanitizeObject(item));
    }

    // Handle objects (recursive sanitization)
    if (typeof input === "object" && input !== null) {
      const sanitized: Record<string, any> = {};
      for (const [key, value] of Object.entries(input)) {
        sanitized[key] = this.sanitizeObject(value);
      }
      return sanitized;
    }

    // If the input is a string, sanitize it (if text)
    if (typeof input === "string") {
      const trimmed = input.trim();
      if (!/<.*?>/.test(trimmed)) return trimmed; // No HTML tags, just return the trimmed string

      return sanitizeHtml(trimmed, {
        allowedTags: [],
        allowedAttributes: {},
      });
    }

    return input;
  }

   private isExcluded(request: any): boolean {
    const reqPath = request.route?.path || request.url;
    const method = request.method;

    return this.excludedPaths.some((path) => {
      return path === reqPath || request.url.startsWith(path);
    });
  }
}
