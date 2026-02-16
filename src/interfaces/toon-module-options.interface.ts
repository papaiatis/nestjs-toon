/**
 * Configuration options for ToonModule
 */
export interface ToonModuleOptions {
  /**
   * Enable response serialization (Object → TOON)
   * @default true
   */
  enableResponseSerialization?: boolean;

  /**
   * Enable request deserialization (TOON → Object)
   * @default true
   */
  enableRequestDeserialization?: boolean;

  /**
   * Apply interceptors globally to all endpoints
   * @default false
   */
  global?: boolean;

  /**
   * Error handling strategy when serialization/deserialization fails
   * - 'throw': Throw exception, let global error filter handle
   * - 'log-and-fallback': Log error and fallback to JSON
   * - 'silent': Fallback to JSON silently without logging
   * @default 'throw'
   */
  errorHandling?: 'throw' | 'log-and-fallback' | 'silent';

  /**
   * Content-Type header value for TOON format
   * @default 'text/toon'
   */
  contentType?: string;

  /**
   * Maximum request body size in bytes for TOON parsing
   * @default 102400 (100KB)
   */
  maxBodySize?: number;

  /**
   * Request body parsing timeout in milliseconds
   * Prevents slow-loris attacks by limiting how long the server waits for request body
   * @default 30000 (30 seconds)
   */
  parseTimeout?: number;

  /**
   * Sanitize error messages in production environment
   * When true, detailed error messages are hidden when NODE_ENV=production
   * Prevents information disclosure attacks
   * @default true
   */
  sanitizeErrors?: boolean;
}
