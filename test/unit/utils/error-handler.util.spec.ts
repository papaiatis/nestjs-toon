import { handleToonError, isToonError } from '../../../src/utils/error-handler.util';
import { ToonModuleOptions } from '../../../src/interfaces/toon-module-options.interface';
import { ToonSerializationException } from '../../../src/exceptions/toon-serialization.exception';
import { ToonDeserializationException } from '../../../src/exceptions/toon-deserialization.exception';

describe('Error Handler Utilities', () => {
  describe('handleToonError', () => {
    const testError = new Error('Test error');
    const context = { operation: 'serialization', endpoint: 'GET /api/test' };

    it('should throw error when errorHandling is "throw"', () => {
      const options: ToonModuleOptions = { errorHandling: 'throw' };
      const result = handleToonError(testError, options, context);
      expect(result.shouldThrow).toBe(true);
      expect(result.fallbackData).toBeUndefined();
    });

    it('should not throw and return fallback for "log-and-fallback"', () => {
      const options: ToonModuleOptions = { errorHandling: 'log-and-fallback' };
      const result = handleToonError(testError, options, context);
      expect(result.shouldThrow).toBe(false);
      expect(result.fallbackData).toBeNull();
    });

    it('should not throw for "silent" mode', () => {
      const options: ToonModuleOptions = { errorHandling: 'silent' };
      const result = handleToonError(testError, options, context);
      expect(result.shouldThrow).toBe(false);
      expect(result.fallbackData).toBeNull();
    });

    it('should default to throw when no options provided', () => {
      const result = handleToonError(testError, undefined, context);
      expect(result.shouldThrow).toBe(true);
    });

    it('should default to throw when errorHandling not specified', () => {
      const options: ToonModuleOptions = {};
      const result = handleToonError(testError, options, context);
      expect(result.shouldThrow).toBe(true);
    });
  });

  describe('isToonError', () => {
    it('should return true for ToonSerializationException', () => {
      const error = new ToonSerializationException('Test error');
      expect(isToonError(error)).toBe(true);
    });

    it('should return true for ToonDeserializationException', () => {
      const error = new ToonDeserializationException('Test error');
      expect(isToonError(error)).toBe(true);
    });

    it('should return false for generic errors', () => {
      const error = new Error('Generic error');
      expect(isToonError(error)).toBe(false);
    });

    it('should return false for errors that merely mention TOON in message', () => {
      const error = new Error('TOON serialization failed');
      expect(isToonError(error)).toBe(false);
    });
  });
});
