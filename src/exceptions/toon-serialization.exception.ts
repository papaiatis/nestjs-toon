import { HttpStatus } from '@nestjs/common';
import { ToonBaseException } from './toon-base.exception';

/**
 * Exception thrown when TOON encoding/serialization fails
 */
export class ToonSerializationException extends ToonBaseException {
  constructor(message: string, originalError?: Error, options?: { sanitizeErrors?: boolean }) {
    super(
      HttpStatus.INTERNAL_SERVER_ERROR,
      'Failed to serialize response to TOON format',
      'ToonSerializationError',
      message,
      originalError,
      options,
    );
  }
}
