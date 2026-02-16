import { HttpStatus } from '@nestjs/common';
import { ToonBaseException } from './toon-base.exception';

/**
 * Exception thrown when TOON decoding/deserialization fails
 */
export class ToonDeserializationException extends ToonBaseException {
  constructor(message: string, originalError?: Error, options?: { sanitizeErrors?: boolean }) {
    super(
      HttpStatus.BAD_REQUEST,
      'Failed to deserialize TOON request body',
      'ToonDeserializationError',
      message,
      originalError,
      options,
    );
  }
}
