import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  Inject,
  Optional,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { ToonSerializerService } from '../services/toon-serializer.service';
import { ToonModuleOptions } from '../interfaces/toon-module-options.interface';
import { TOON_FALLBACK_HEADER, TOON_CONTENT_TYPE } from '../constants/toon.constants';
import { MODULE_OPTIONS_TOKEN } from '../toon.module-definition';
import { acceptsToon } from '../utils/content-negotiation.util';
import { handleToonError } from '../utils/error-handler.util';

/**
 * Interceptor that serializes response objects to TOON format
 * when client requests it via Accept header
 */
@Injectable()
export class ToonResponseInterceptor implements NestInterceptor {
  constructor(
    private readonly toonSerializer: ToonSerializerService,
    @Optional()
    @Inject(MODULE_OPTIONS_TOKEN)
    private readonly options?: ToonModuleOptions,
  ) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    if (this.options?.enableResponseSerialization === false) {
      return next.handle();
    }

    const request = context.switchToHttp().getRequest();
    const response = context.switchToHttp().getResponse();
    const contentType = this.options?.contentType || TOON_CONTENT_TYPE;

    if (!acceptsToon(request.headers?.accept, contentType)) {
      return next.handle();
    }

    return next.handle().pipe(
      map((data) => {
        try {
          const toonData = this.toonSerializer.encode(data);
          response.setHeader('Content-Type', contentType);
          return toonData;
        } catch (error) {
          const { shouldThrow, fallbackData } = handleToonError(error as Error, this.options, {
            operation: 'serialization',
            endpoint: `${request.method} ${request.url}`,
          });

          if (shouldThrow) {
            throw error;
          }

          response.setHeader('Content-Type', 'application/json');
          response.setHeader(TOON_FALLBACK_HEADER, 'true');
          return fallbackData !== null ? fallbackData : data;
        }
      }),
    );
  }
}
