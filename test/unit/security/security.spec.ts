import { describe, it, expect, beforeEach } from 'vitest';
import { ToonBodyParserMiddleware } from '../../../src/middleware/toon-body-parser.middleware';
import { ToonSerializerService } from '../../../src/services/toon-serializer.service';
import { ToonDeserializationException } from '../../../src/exceptions/toon-deserialization.exception';
import { parseAcceptHeader } from '../../../src/utils/content-negotiation.util';
import { validateContentType } from '../../../src/utils/validation.util';
import { Request, Response, NextFunction } from 'express';
import { EventEmitter } from 'events';
import { Socket } from 'net';

describe('Security Tests', () => {
  describe('Body Size Race Condition (Issue #1)', () => {
    let middleware: ToonBodyParserMiddleware;
    let toonSerializer: ToonSerializerService;

    beforeEach(() => {
      toonSerializer = new ToonSerializerService();
      middleware = new ToonBodyParserMiddleware(toonSerializer, {
        maxBodySize: 100, // 100 bytes for testing
      });
    });

    it('should prevent data accumulation after size limit exceeded', (done) => {
      const req = new EventEmitter() as Request;
      req.headers = { 'content-type': 'text/toon' };
      req.socket = { destroyed: false, destroy: () => {} } as Socket;

      const res = {
        status: () => ({ json: () => {} }),
        json: () => {},
      } as unknown as Response;

      const next = (() => {}) as NextFunction;

      middleware.use(req, res, next);

      // Simulate multiple data chunks arriving quickly
      const chunk1 = Buffer.from('x'.repeat(60)); // 60 bytes
      const chunk2 = Buffer.from('x'.repeat(60)); // 60 bytes (total 120, exceeds 100)
      const chunk3 = Buffer.from('x'.repeat(60)); // Should be ignored due to exceededLimit flag

      req.emit('data', chunk1);
      req.emit('data', chunk2); // This should trigger the limit
      req.emit('data', chunk3); // This should be ignored

      // Wait a bit to ensure all events processed
      setTimeout(() => {
        expect(req.socket.destroyed).toBe(false); // Socket destroy is mocked
        done();
      }, 50);
    });
  });

  describe('Request Timeout (Issue #2)', () => {
    let middleware: ToonBodyParserMiddleware;
    let toonSerializer: ToonSerializerService;

    beforeEach(() => {
      toonSerializer = new ToonSerializerService();
      middleware = new ToonBodyParserMiddleware(toonSerializer, {
        parseTimeout: 100, // 100ms for testing
      });
    });

    it('should timeout if request body parsing takes too long', (done) => {
      const req = new EventEmitter() as Request;
      req.headers = { 'content-type': 'text/toon' };
      req.socket = { destroyed: false, destroy: () => {} } as Socket;

      let timeoutTriggered = false;
      const res = {
        status: (code: number) => ({
          json: () => {
            if (code === 408) {
              timeoutTriggered = true;
            }
          },
        }),
      } as unknown as Response;

      const next = (() => {}) as NextFunction;

      middleware.use(req, res, next);

      // Emit data but never emit 'end' - simulates slow request
      req.emit('data', Buffer.from('test data'));

      // Wait for timeout to trigger
      setTimeout(() => {
        expect(timeoutTriggered).toBe(true);
        done();
      }, 150); // Wait longer than parseTimeout
    });

    it('should clear timeout on successful completion', (done) => {
      const req = new EventEmitter() as Request;
      req.headers = { 'content-type': 'text/toon' };
      req.socket = { destroyed: false, destroy: () => {} } as Socket;

      let timeoutTriggered = false;
      const res = {
        status: (code: number) => ({
          json: () => {
            if (code === 408) {
              timeoutTriggered = true;
            }
          },
        }),
      } as unknown as Response;

      const next = (() => {}) as NextFunction;

      middleware.use(req, res, next);

      // Emit valid TOON data and complete quickly
      req.emit('data', Buffer.from('key: value'));
      req.emit('end');

      // Wait longer than parseTimeout to verify timeout was cleared
      setTimeout(() => {
        expect(timeoutTriggered).toBe(false);
        done();
      }, 150);
    });
  });

  describe('Content-Type Validation (Issue #3)', () => {
    it('should reject content-type with newline characters', () => {
      expect(() => {
        validateContentType('text/toon\r\nX-Evil: injected');
      }).toThrow(/control characters or newlines/);
    });

    it('should reject content-type with control characters', () => {
      expect(() => {
        validateContentType('text/toon\x00');
      }).toThrow(/control characters or newlines/);
    });

    it('should reject invalid MIME type format', () => {
      expect(() => {
        validateContentType('not-a-mime-type');
      }).toThrow(/valid MIME type/);

      expect(() => {
        validateContentType('text/');
      }).toThrow(/valid MIME type/);

      expect(() => {
        validateContentType('/subtype');
      }).toThrow(/valid MIME type/);
    });

    it('should accept valid MIME types', () => {
      expect(() => validateContentType('text/toon')).not.toThrow();
      expect(() => validateContentType('application/x-custom+json')).not.toThrow();
      expect(() => validateContentType('text/plain')).not.toThrow();
    });
  });

  describe('Accept Header DoS (Issue #4)', () => {
    it('should reject Accept header exceeding 8KB', () => {
      const largeHeader = 'text/html,'.repeat(2000); // > 8KB

      expect(() => {
        parseAcceptHeader(largeHeader);
      }).toThrow(/exceeds maximum length/);
    });

    it('should limit parsing to 20 media types', () => {
      // Create 100 media types
      const mediaTypes = Array.from({ length: 100 }, (_, i) => `type${i}/subtype${i}`).join(',');
      const result = parseAcceptHeader(mediaTypes);

      // Should only parse first 20
      expect(result.length).toBeLessThanOrEqual(20);
    });

    it('should handle normal Accept headers efficiently', () => {
      const normalHeader = 'text/html,application/json;q=0.9,text/plain;q=0.8';
      const result = parseAcceptHeader(normalHeader);

      expect(result).toHaveLength(3);
      expect(result[0].type).toBe('text/html');
      expect(result[0].quality).toBe(1.0);
    });
  });

  describe('Error Message Sanitization (Issue #5)', () => {
    it('should hide error details in production mode', () => {
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'production';

      try {
        const toonSerializer = new ToonSerializerService({ sanitizeErrors: true });

        let caughtError: ToonDeserializationException | null = null;
        try {
          // Empty string should throw
          toonSerializer.decode('');
        } catch (error) {
          caughtError = error as ToonDeserializationException;
        }

        expect(caughtError).toBeInstanceOf(ToonDeserializationException);
        const response = caughtError!.getResponse() as any;
        expect(response.details).toBeUndefined();
        expect(response.originalError).toBeUndefined();
        expect(response.message).toBe('Failed to deserialize TOON request body');
      } finally {
        process.env.NODE_ENV = originalEnv;
      }
    });

    it('should show error details in development mode', () => {
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'development';

      try {
        const toonSerializer = new ToonSerializerService({ sanitizeErrors: true });

        let caughtError: ToonDeserializationException | null = null;
        try {
          // Empty string should throw
          toonSerializer.decode('');
        } catch (error) {
          caughtError = error as ToonDeserializationException;
        }

        expect(caughtError).toBeInstanceOf(ToonDeserializationException);
        const response = caughtError!.getResponse() as any;
        expect(response.details).toBeDefined();
        expect(response.details).toContain('empty');
      } finally {
        process.env.NODE_ENV = originalEnv;
      }
    });

    it('should show error details when sanitizeErrors is false', () => {
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'production';

      try {
        const toonSerializer = new ToonSerializerService({ sanitizeErrors: false });

        let caughtError: ToonDeserializationException | null = null;
        try {
          // Empty string should throw
          toonSerializer.decode('');
        } catch (error) {
          caughtError = error as ToonDeserializationException;
        }

        expect(caughtError).toBeInstanceOf(ToonDeserializationException);
        const response = caughtError!.getResponse() as any;
        expect(response.details).toBeDefined();
      } finally {
        process.env.NODE_ENV = originalEnv;
      }
    });

    it('should sanitize middleware error responses in production', (done) => {
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'production';

      try {
        const toonSerializer = new ToonSerializerService();
        const middleware = new ToonBodyParserMiddleware(toonSerializer, {
          sanitizeErrors: true,
        });

        const req = new EventEmitter() as Request;
        req.headers = { 'content-type': 'text/toon' };
        req.socket = { destroyed: false, destroy: () => {} } as Socket;

        let errorResponse: any;
        const res = {
          status: (code: number) => ({
            json: (responseBody: unknown) => {
              if (code === 400) {
                errorResponse = responseBody;
              }
            },
          }),
        } as unknown as Response;

        const next = (() => {}) as NextFunction;

        middleware.use(req, res, next);

        // Send invalid TOON data
        req.emit('data', Buffer.from('invalid: @#$%^&*'));
        req.emit('end');

        setTimeout(() => {
          expect(errorResponse).toBeDefined();
          expect(errorResponse.details).toBeUndefined();
          process.env.NODE_ENV = originalEnv;
          done();
        }, 50);
      } catch (error) {
        process.env.NODE_ENV = originalEnv;
        throw error;
      }
    });
  });
});
