import { Injectable, NestMiddleware, Inject, Optional } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { ToonSerializerService } from '../services/toon-serializer.service';
import { ToonModuleOptions } from '../interfaces/toon-module-options.interface';
import {
  TOON_CONTENT_TYPE,
  DEFAULT_MAX_BODY_SIZE,
  DEFAULT_PARSE_TIMEOUT,
} from '../constants/toon.constants';
import { MODULE_OPTIONS_TOKEN } from '../toon.module-definition';
import { handleToonError } from '../utils/error-handler.util';
import { shouldIncludeErrorDetails } from '../exceptions/toon-base.exception';

/**
 * Middleware that parses TOON request bodies before they reach interceptors
 */
@Injectable()
export class ToonBodyParserMiddleware implements NestMiddleware {
  constructor(
    private readonly toonSerializer: ToonSerializerService,
    @Optional()
    @Inject(MODULE_OPTIONS_TOKEN)
    private readonly options?: ToonModuleOptions,
  ) {}

  use(req: Request, res: Response, next: NextFunction) {
    if (this.options?.enableRequestDeserialization === false) {
      return next();
    }

    const contentType = this.options?.contentType || TOON_CONTENT_TYPE;

    if (!req.headers['content-type']?.includes(contentType)) {
      return next();
    }

    const maxBodySize = this.options?.maxBodySize || DEFAULT_MAX_BODY_SIZE;
    const parseTimeout = this.options?.parseTimeout || DEFAULT_PARSE_TIMEOUT;
    const includeDetails = shouldIncludeErrorDetails(this.options);

    let rawBody = '';
    let bodySize = 0;
    let exceededLimit = false;
    let requestCompleted = false;

    // Set up timeout to prevent slow-loris attacks
    const timer = setTimeout(() => {
      if (!requestCompleted && !req.socket.destroyed) {
        requestCompleted = true;
        res.status(408).json({
          statusCode: 408,
          message: 'Request body parsing timeout',
          error: 'RequestTimeoutError',
        });
        req.socket.destroy();
      }
    }, parseTimeout);

    req.on('data', (chunk: Buffer) => {
      if (exceededLimit) {
        return;
      }

      bodySize += chunk.length;

      if (bodySize > maxBodySize) {
        exceededLimit = true;
        requestCompleted = true;
        clearTimeout(timer);
        res.status(413).json({
          statusCode: 413,
          message: 'Request body too large',
          error: 'PayloadTooLargeError',
        });
        req.socket.destroy();
        return;
      }

      rawBody += chunk.toString('utf8');
    });

    req.on('end', () => {
      if (requestCompleted) {
        return;
      }
      requestCompleted = true;
      clearTimeout(timer);

      try {
        req.body = this.toonSerializer.decode(rawBody);
        next();
      } catch (error) {
        const { shouldThrow } = handleToonError(error as Error, this.options, {
          operation: 'deserialization',
          endpoint: `${req.method} ${req.url}`,
        });

        if (shouldThrow) {
          const errorResponse: Record<string, unknown> = {
            statusCode: 400,
            message: 'Failed to parse TOON request body',
            error: 'BadRequestError',
          };

          if (includeDetails) {
            errorResponse.details = (error as Error).message;
          }

          res.status(400).json(errorResponse);
        } else {
          req.body = {};
          next();
        }
      }
    });

    req.on('error', () => {
      if (requestCompleted) {
        return;
      }
      requestCompleted = true;
      clearTimeout(timer);

      res.status(500).json({
        statusCode: 500,
        message: 'Error reading request body',
        error: 'InternalServerError',
      });
    });
  }
}
