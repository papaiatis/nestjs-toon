import {
  TOON_CONTENT_TYPE,
  MAX_ACCEPT_HEADER_LENGTH,
  MAX_MEDIA_TYPES,
} from '../constants/toon.constants';

/**
 * Parse Accept header and check if client accepts TOON format
 * @param acceptHeader - The Accept header from the request
 * @param contentType - The content type to check for (default: text/toon)
 * @returns true if client accepts the content type
 */
export function acceptsToon(
  acceptHeader: string | undefined,
  contentType = TOON_CONTENT_TYPE,
): boolean {
  if (!acceptHeader) {
    return false;
  }

  // Normalize header
  const normalized = acceptHeader.toLowerCase().trim();

  // Only match exact content type or type-level wildcard (e.g., text/*).
  // Deliberately NOT matching */* because TOON is a specialized format
  // that should only be returned when explicitly requested.
  if (normalized.includes(contentType.toLowerCase())) {
    return true;
  }

  const [type] = contentType.split('/');
  if (normalized.includes(`${type}/*`)) {
    return true;
  }

  return false;
}

/**
 * Parse media type with quality values (q parameter)
 * @param acceptHeader - The Accept header from the request
 * @returns Array of media types sorted by quality (highest first)
 * @throws Error if Accept header exceeds security limits
 */
export function parseAcceptHeader(acceptHeader: string): Array<{ type: string; quality: number }> {
  if (!acceptHeader) {
    return [];
  }

  // Security: Limit header length to prevent DoS (RFC 7230 recommends 8KB)
  if (acceptHeader.length > MAX_ACCEPT_HEADER_LENGTH) {
    throw new Error(
      `Accept header exceeds maximum length (${MAX_ACCEPT_HEADER_LENGTH} bytes). ` +
        `Received ${acceptHeader.length} bytes.`,
    );
  }

  // Security: Limit number of media types to prevent DoS
  const parts = acceptHeader.split(',').slice(0, MAX_MEDIA_TYPES);

  const mediaTypes = parts.map((part) => {
    const [type, ...params] = part.trim().split(';');
    let quality = 1.0;

    // Parse q parameter
    const qParam = params.find((p) => p.trim().startsWith('q='));
    if (qParam) {
      const qValue = parseFloat(qParam.split('=')[1]);
      if (!isNaN(qValue)) {
        quality = Math.max(0, Math.min(1, qValue)); // Clamp between 0 and 1
      }
    }

    return { type: type.trim().toLowerCase(), quality };
  });

  // Sort by quality (highest first)
  return mediaTypes.sort((a, b) => b.quality - a.quality);
}

/**
 * Determine the best content type based on Accept header and supported types
 * @param acceptHeader - The Accept header from the request
 * @param supportedTypes - Array of supported content types
 * @returns The best matching content type or null if none match
 */
export function negotiateContentType(
  acceptHeader: string | undefined,
  supportedTypes: string[],
): string | null {
  if (!acceptHeader) {
    return supportedTypes[0] || null;
  }

  const parsed = parseAcceptHeader(acceptHeader);
  const normalizedSupported = supportedTypes.map((t) => t.toLowerCase());

  for (const { type, quality } of parsed) {
    if (quality === 0) continue; // Skip explicitly rejected types

    // Check for exact match
    if (normalizedSupported.includes(type)) {
      return supportedTypes[normalizedSupported.indexOf(type)];
    }

    // Check for wildcard matches
    if (type === '*/*') {
      return supportedTypes[0];
    }

    // Check for type wildcard (e.g., text/*)
    if (type.endsWith('/*')) {
      const [baseType] = type.split('/');
      const match = supportedTypes.find((s) => s.toLowerCase().startsWith(`${baseType}/`));
      if (match) return match;
    }
  }

  return null;
}
