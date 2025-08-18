import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import * as fs from 'fs';
import { BadRequestException, CallHandler, ConflictException, ExecutionContext, Injectable, NestInterceptor } from '@nestjs/common';

@Injectable()
export class DeleteUploadedFileInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest();
    const file = request.file as Express.Multer.File;

    return next.handle().pipe(
      catchError(err => {
        if (file && (err instanceof BadRequestException || err instanceof ConflictException)) {
          fs.unlink(file.path, (unlinkErr) => {
            if (unlinkErr) {
              console.error(`Error deleting uploaded file: ${unlinkErr.message}`);
            }
          });
        }
        return throwError(() => err);
      }),
    );
  }
}
