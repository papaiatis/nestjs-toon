import { HttpException, HttpStatus } from '@nestjs/common';

/**
 * Determines whether error details should be included in the response.
 * Details are hidden in production unless sanitization is explicitly disabled.
 */
export function shouldIncludeErrorDetails(options?: { sanitizeErrors?: boolean }): boolean {
  const isProduction = process.env.NODE_ENV === 'production';
  const shouldSanitize = options?.sanitizeErrors !== false;
  return !isProduction || !shouldSanitize;
}

/**
 * Base exception for TOON serialization/deserialization errors.
 * Handles error sanitization in production to prevent information disclosure.
 */
export class ToonBaseException extends HttpException {
  constructor(
    statusCode: HttpStatus,
    publicMessage: string,
    errorName: string,
    detailMessage: string,
    originalError?: Error,
    options?: { sanitizeErrors?: boolean },
  ) {
    const response: Record<string, unknown> = {
      statusCode,
      message: publicMessage,
      error: errorName,
    };

    if (shouldIncludeErrorDetails(options)) {
      response.details = detailMessage;
      if (originalError?.message) {
        response.originalError = originalError.message;
      }
    }

    super(response, statusCode);
  }
}
