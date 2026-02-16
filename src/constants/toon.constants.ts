/**
 * TOON format MIME type
 */
export const TOON_CONTENT_TYPE = 'text/toon';

/**
 * Metadata key for @UseToon() decorator
 */
export const TOON_ENABLED_METADATA = 'toon:enabled';

/**
 * Default error handling strategy
 */
export const DEFAULT_ERROR_HANDLING = 'throw' as const;

/**
 * Maximum body size for TOON parsing (100KB)
 */
export const DEFAULT_MAX_BODY_SIZE = 100 * 1024;

/**
 * Header name for fallback indicator
 */
export const TOON_FALLBACK_HEADER = 'X-Toon-Fallback';

/**
 * Default request body parsing timeout (30 seconds)
 * Prevents slow-loris attacks by limiting how long the server waits for request body
 */
export const DEFAULT_PARSE_TIMEOUT = 30000;

/**
 * Maximum Accept header length (8KB per RFC 7230)
 * Prevents DoS attacks via oversized Accept headers
 */
export const MAX_ACCEPT_HEADER_LENGTH = 8192;

/**
 * Maximum number of media types in Accept header
 * Prevents DoS attacks via excessive content negotiation
 */
export const MAX_MEDIA_TYPES = 20;
