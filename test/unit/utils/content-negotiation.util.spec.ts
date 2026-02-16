import {
  acceptsToon,
  parseAcceptHeader,
  negotiateContentType,
} from '../../../src/utils/content-negotiation.util';

describe('Content Negotiation Utilities', () => {
  describe('acceptsToon', () => {
    it('should return true for exact match', () => {
      expect(acceptsToon('text/toon')).toBe(true);
    });

    it('should return true for mixed content types including text/toon', () => {
      expect(acceptsToon('application/json, text/toon')).toBe(true);
    });

    it('should return false for wildcard */* (TOON must be explicitly requested)', () => {
      expect(acceptsToon('*/*')).toBe(false);
    });

    it('should return true for type wildcard text/*', () => {
      expect(acceptsToon('text/*')).toBe(true);
    });

    it('should return false for non-matching type', () => {
      expect(acceptsToon('application/json')).toBe(false);
    });

    it('should return false for undefined header', () => {
      expect(acceptsToon(undefined)).toBe(false);
    });

    it('should be case-insensitive', () => {
      expect(acceptsToon('TEXT/TOON')).toBe(true);
      expect(acceptsToon('Text/Toon')).toBe(true);
    });

    it('should handle custom content type', () => {
      expect(acceptsToon('application/custom', 'application/custom')).toBe(true);
    });
  });

  describe('parseAcceptHeader', () => {
    it('should parse simple Accept header', () => {
      const result = parseAcceptHeader('text/toon');
      expect(result).toHaveLength(1);
      expect(result[0]).toEqual({ type: 'text/toon', quality: 1.0 });
    });

    it('should parse multiple media types', () => {
      const result = parseAcceptHeader('text/toon, application/json');
      expect(result).toHaveLength(2);
    });

    it('should parse quality values', () => {
      const result = parseAcceptHeader('text/toon;q=0.9, application/json;q=0.8');
      expect(result[0].quality).toBe(0.9);
      expect(result[1].quality).toBe(0.8);
    });

    it('should sort by quality (highest first)', () => {
      const result = parseAcceptHeader('text/toon;q=0.5, application/json;q=0.9');
      expect(result[0].type).toBe('application/json');
      expect(result[0].quality).toBe(0.9);
      expect(result[1].type).toBe('text/toon');
      expect(result[1].quality).toBe(0.5);
    });

    it('should default quality to 1.0', () => {
      const result = parseAcceptHeader('text/toon');
      expect(result[0].quality).toBe(1.0);
    });

    it('should clamp quality between 0 and 1', () => {
      const result = parseAcceptHeader('text/toon;q=1.5, application/json;q=-0.5');
      expect(result[0].quality).toBe(1.0);
      expect(result[1].quality).toBe(0.0);
    });

    it('should return empty array for empty header', () => {
      expect(parseAcceptHeader('')).toEqual([]);
    });
  });

  describe('negotiateContentType', () => {
    const supportedTypes = ['text/toon', 'application/json'];

    it('should return exact match', () => {
      const result = negotiateContentType('text/toon', supportedTypes);
      expect(result).toBe('text/toon');
    });

    it('should return first supported type for */*', () => {
      const result = negotiateContentType('*/*', supportedTypes);
      expect(result).toBe('text/toon');
    });

    it('should handle type wildcards', () => {
      const result = negotiateContentType('text/*', supportedTypes);
      expect(result).toBe('text/toon');
    });

    it('should respect quality values', () => {
      const result = negotiateContentType(
        'application/json;q=0.9, text/toon;q=0.5',
        supportedTypes,
      );
      expect(result).toBe('application/json');
    });

    it('should skip types with q=0', () => {
      const result = negotiateContentType('text/toon;q=0, application/json', supportedTypes);
      expect(result).toBe('application/json');
    });

    it('should return null for no match', () => {
      const result = negotiateContentType('application/xml', supportedTypes);
      expect(result).toBeNull();
    });

    it('should return first supported type for undefined header', () => {
      const result = negotiateContentType(undefined, supportedTypes);
      expect(result).toBe('text/toon');
    });

    it('should be case-insensitive', () => {
      const result = negotiateContentType('TEXT/TOON', supportedTypes);
      expect(result).toBe('text/toon');
    });
  });
});
