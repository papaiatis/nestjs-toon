import { Injectable, Inject, Optional } from '@nestjs/common';
import { encode, decode } from '@toon-format/toon';
import { ToonSerializationException } from '../exceptions/toon-serialization.exception';
import { ToonDeserializationException } from '../exceptions/toon-deserialization.exception';
import { ToonModuleOptions } from '../interfaces/toon-module-options.interface';
import { MODULE_OPTIONS_TOKEN } from '../toon.module-definition';

/**
 * Service that wraps @toon-format/toon library with error handling
 * and configuration support
 */
@Injectable()
export class ToonSerializerService {
  constructor(
    @Optional()
    @Inject(MODULE_OPTIONS_TOKEN)
    private readonly options?: ToonModuleOptions,
  ) {}

  /**
   * Encode JavaScript object to TOON string
   * @param data - Object to encode
   * @returns TOON-formatted string
   * @throws ToonSerializationException if encoding fails
   */
  encode(data: any): string {
    try {
      if (data === null || data === undefined) {
        return encode(data);
      }

      // Convert class instances to plain objects (TOON expects plain objects).
      // JSON.stringify also detects circular references with a clear error.
      const plainData = JSON.parse(JSON.stringify(data));

      return encode(plainData);
    } catch (error) {
      throw new ToonSerializationException(
        error instanceof Error ? error.message : 'Unknown serialization error',
        error instanceof Error ? error : undefined,
        { sanitizeErrors: this.options?.sanitizeErrors },
      );
    }
  }

  /**
   * Decode TOON string to JavaScript object
   * @param toonString - TOON-formatted string
   * @returns Decoded JavaScript object
   * @throws ToonDeserializationException if decoding fails
   */
  decode(toonString: string): any {
    try {
      if (typeof toonString !== 'string') {
        throw new Error('Input must be a string');
      }
      if (toonString.trim() === '') {
        throw new Error('Input string is empty');
      }
      return decode(toonString);
    } catch (error) {
      throw new ToonDeserializationException(
        error instanceof Error ? error.message : 'Unknown deserialization error',
        error instanceof Error ? error : undefined,
        { sanitizeErrors: this.options?.sanitizeErrors },
      );
    }
  }

  /**
   * Check if data can be safely serialized to TOON
   * @param data - Data to check
   * @returns true if serializable, false otherwise
   */
  canSerialize(data: any): boolean {
    try {
      this.detectCircularReferences(data);
      return true;
    } catch {
      return false;
    }
  }

  private detectCircularReferences(obj: any, seen = new WeakSet()): void {
    if (obj === null || typeof obj !== 'object') {
      return;
    }

    if (seen.has(obj)) {
      throw new Error('Circular reference detected');
    }

    seen.add(obj);

    const values = Array.isArray(obj) ? obj : Object.values(obj);
    for (const value of values) {
      this.detectCircularReferences(value, seen);
    }
  }
}
