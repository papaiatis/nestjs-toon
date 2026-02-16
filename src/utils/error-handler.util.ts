import { Logger } from '@nestjs/common';
import { ToonModuleOptions } from '../interfaces/toon-module-options.interface';
import { ToonSerializationException } from '../exceptions/toon-serialization.exception';
import { ToonDeserializationException } from '../exceptions/toon-deserialization.exception';
import { DEFAULT_ERROR_HANDLING } from '../constants/toon.constants';

const logger = new Logger('ToonErrorHandler');

/**
 * Handle serialization/deserialization errors based on configuration
 * @param error - The error that occurred
 * @param options - Module configuration options
 * @param context - Context information for logging
 * @returns Object with shouldThrow flag and optional fallbackData
 */
export function handleToonError(
  error: Error,
  options: ToonModuleOptions | undefined,
  context: { operation: string; endpoint?: string },
): { shouldThrow: boolean; fallbackData?: any } {
  const errorHandling = options?.errorHandling || DEFAULT_ERROR_HANDLING;

  switch (errorHandling) {
    case 'throw':
      return { shouldThrow: true };

    case 'log-and-fallback': {
      const errorMessage = `TOON ${context.operation} failed${context.endpoint ? ` at ${context.endpoint}` : ''}: ${error.message}`;
      logger.error(errorMessage, error.stack);
      return { shouldThrow: false, fallbackData: null };
    }

    case 'silent':
      return { shouldThrow: false, fallbackData: null };

    default:
      return { shouldThrow: true };
  }
}

/**
 * Check if an error is a TOON-related error
 * @param error - Error to check
 * @returns true if error is TOON-related
 */
export function isToonError(error: Error): boolean {
  return (
    error instanceof ToonSerializationException || error instanceof ToonDeserializationException
  );
}
