import { Request, Response } from 'express';
import { ToonBodyParserMiddleware } from '../../../src/middleware/toon-body-parser.middleware';
import { ToonSerializerService } from '../../../src/services/toon-serializer.service';
import { EventEmitter } from 'events';
import { vi } from 'vitest';

describe('ToonBodyParserMiddleware', () => {
  let middleware: ToonBodyParserMiddleware;
  let serializerService: ToonSerializerService;

  beforeEach(() => {
    serializerService = new ToonSerializerService();
    middleware = new ToonBodyParserMiddleware(serializerService, {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should be defined', () => {
    expect(middleware).toBeDefined();
  });

  describe('Content-Type handling', () => {
    it('should pass through for non-TOON content types', () => {
      return new Promise<void>((resolve) => {
        const mockReq = new EventEmitter() as any;
        mockReq.headers = { 'content-type': 'application/json' };

        const mockRes = {} as Response;
        const mockNext = vi.fn(() => {
          expect(mockNext).toHaveBeenCalled();
          resolve();
        });

        middleware.use(mockReq as Request, mockRes, mockNext);
      });
    });

    it('should process TOON content type', () => {
      return new Promise<void>((resolve) => {
        const mockReq = new EventEmitter() as any;
        mockReq.headers = { 'content-type': 'text/toon' };
        mockReq.method = 'POST';
        mockReq.url = '/test';

        const mockRes = {} as Response;
        const mockNext = vi.fn(() => {
          expect(mockReq.body).toEqual({ name: 'Alice', age: 30 });
          resolve();
        });

        vi.spyOn(serializerService, 'decode').mockReturnValue({ name: 'Alice', age: 30 });

        middleware.use(mockReq as Request, mockRes, mockNext);

        // Simulate data and end events
        mockReq.emit('data', Buffer.from('name: Alice\nage: 30'));
        mockReq.emit('end');
      });
    });

    it('should respect custom content type from options', () => {
      const customMiddleware = new ToonBodyParserMiddleware(serializerService, {
        contentType: 'application/toon',
      });

      return new Promise<void>((resolve) => {
        const mockReq = new EventEmitter() as any;
        mockReq.headers = { 'content-type': 'application/toon' };
        mockReq.method = 'POST';
        mockReq.url = '/test';

        const mockRes = {} as Response;
        const mockNext = vi.fn(() => {
          resolve();
        });

        vi.spyOn(serializerService, 'decode').mockReturnValue({ test: 'data' });

        customMiddleware.use(mockReq as Request, mockRes, mockNext);

        mockReq.emit('data', Buffer.from('test: data'));
        mockReq.emit('end');
      });
    });
  });

  describe('Body size limits', () => {
    it('should reject body larger than maxBodySize', () => {
      return new Promise<void>((resolve) => {
        const destroyFn = vi.fn();
        const mockReq = new EventEmitter() as any;
        mockReq.headers = { 'content-type': 'text/toon' };
        mockReq.socket = { destroy: destroyFn };

        const mockRes = {
          status: vi.fn().mockReturnThis(),
          json: vi.fn((data) => {
            expect(data.statusCode).toBe(413);
            // Check destroy was called with a slight delay
            setTimeout(() => {
              expect(destroyFn).toHaveBeenCalled();
              resolve();
            }, 10);
          }),
        } as any;

        const mockNext = vi.fn();

        middleware.use(mockReq as Request, mockRes, mockNext);

        // Emit data larger than 100KB
        const largeData = Buffer.alloc(150 * 1024, 'a');
        mockReq.emit('data', largeData);
      });
    });
  });

  describe('Error handling', () => {
    it('should handle deserialization errors with throw mode', () => {
      const errorMiddleware = new ToonBodyParserMiddleware(serializerService, {
        errorHandling: 'throw',
      });

      return new Promise<void>((resolve) => {
        const mockReq = new EventEmitter() as any;
        mockReq.headers = { 'content-type': 'text/toon' };
        mockReq.method = 'POST';
        mockReq.url = '/test';

        const mockRes = {
          status: vi.fn().mockReturnThis(),
          json: vi.fn((data) => {
            expect(data.statusCode).toBe(400);
            expect(data.message).toContain('Failed to parse');
            resolve();
          }),
        } as any;

        const mockNext = vi.fn();

        vi.spyOn(serializerService, 'decode').mockImplementation(() => {
          throw new Error('Invalid TOON');
        });

        errorMiddleware.use(mockReq as Request, mockRes, mockNext);

        mockReq.emit('data', Buffer.from('invalid toon'));
        mockReq.emit('end');
      });
    });

    it('should handle deserialization errors with silent mode', () => {
      const silentMiddleware = new ToonBodyParserMiddleware(serializerService, {
        errorHandling: 'silent',
      });

      return new Promise<void>((resolve) => {
        const mockReq = new EventEmitter() as any;
        mockReq.headers = { 'content-type': 'text/toon' };
        mockReq.method = 'POST';
        mockReq.url = '/test';

        const mockRes = {} as Response;
        const mockNext = vi.fn(() => {
          expect(mockReq.body).toEqual({});
          resolve();
        });

        vi.spyOn(serializerService, 'decode').mockImplementation(() => {
          throw new Error('Invalid TOON');
        });

        silentMiddleware.use(mockReq as Request, mockRes, mockNext);

        mockReq.emit('data', Buffer.from('invalid toon'));
        mockReq.emit('end');
      });
    });
  });

  describe('Disabled deserialization', () => {
    it('should pass through when deserialization is disabled', () => {
      const disabledMiddleware = new ToonBodyParserMiddleware(serializerService, {
        enableRequestDeserialization: false,
      });

      return new Promise<void>((resolve) => {
        const mockReq = new EventEmitter() as any;
        mockReq.headers = { 'content-type': 'text/toon' };

        const mockRes = {} as Response;
        const mockNext = vi.fn(() => {
          expect(mockNext).toHaveBeenCalled();
          resolve();
        });

        disabledMiddleware.use(mockReq as Request, mockRes, mockNext);
      });
    });
  });
});
