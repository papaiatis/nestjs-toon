/**
 * Validates a Content-Type string according to RFC 2045 MIME type format
 * @param contentType - The content type string to validate
 * @throws Error if the content type is invalid
 */
export function validateContentType(contentType: string): void {
  // Security check first: prevent header injection via newlines or control characters
  if (/[\r\n\x00-\x1F\x7F]/.test(contentType)) {
    throw new Error(
      `Invalid contentType "${contentType}". Content-Type must not contain control characters or newlines.`,
    );
  }

  // RFC 2045 compliant media type validation
  // Format: type/subtype where both parts follow specific character rules
  // Allowed: alphanumeric and special chars: !#$&-^_.+
  const mimeTypeRegex =
    /^[a-zA-Z0-9][a-zA-Z0-9!#$&\-^_+.]{0,126}\/[a-zA-Z0-9][a-zA-Z0-9!#$&\-^_+.]{0,126}$/;

  if (!mimeTypeRegex.test(contentType)) {
    throw new Error(
      `Invalid contentType "${contentType}". Must be a valid MIME type (RFC 2045) such as "text/toon" or "application/x-custom+json".`,
    );
  }
}
