import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, Controller, Post, Body, Module } from '@nestjs/common';
import request from 'supertest';
import { ToonModule } from '../../src/toon.module';
import { ToonBodyParserMiddleware } from '../../src/middleware/toon-body-parser.middleware';

// Test controller
@Controller('security')
class SecurityTestController {
  @Post('data')
  receiveData(@Body() body: any) {
    return { received: body };
  }
}

@Module({
  imports: [
    ToonModule.forRoot({
      enableRequestDeserialization: true,
      maxBodySize: 1000, // 1KB for testing
      parseTimeout: 500, // 500ms for testing
      sanitizeErrors: true,
    }),
  ],
  controllers: [SecurityTestController],
  providers: [ToonBodyParserMiddleware],
})
class SecurityTestModule {}

describe('Security E2E Tests', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [SecurityTestModule],
    }).compile();

    app = moduleFixture.createNestApplication();

    // Apply middleware (get it from the module's providers)
    const toonBodyParserMiddleware = moduleFixture.get(ToonBodyParserMiddleware);
    app.use(toonBodyParserMiddleware.use.bind(toonBodyParserMiddleware));

    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  describe('Body Size Enforcement', () => {
    it('should reject requests exceeding maxBodySize', async () => {
      const largeData = 'x'.repeat(2000); // 2KB, exceeds 1KB limit

      const response = await request(app.getHttpServer())
        .post('/security/data')
        .set('Content-Type', 'text/toon')
        .send(largeData)
        .expect(413);

      expect(response.body.error).toBe('PayloadTooLargeError');
      expect(response.body.message).toBe('Request body too large');
    });

    it('should accept requests within size limit', async () => {
      const validData = 'name: Alice\nage: 30'; // Small payload

      const response = await request(app.getHttpServer())
        .post('/security/data')
        .set('Content-Type', 'text/toon')
        .set('Accept', 'application/json')
        .send(validData)
        .expect(201);

      expect(response.body.received).toEqual({ name: 'Alice', age: 30 });
    });
  });

  describe('Parse Timeout', () => {
    it('should handle slow requests within timeout', async () => {
      const validData = 'name: Bob';

      const response = await request(app.getHttpServer())
        .post('/security/data')
        .set('Content-Type', 'text/toon')
        .set('Accept', 'application/json')
        .send(validData)
        .expect(201);

      expect(response.body.received).toEqual({ name: 'Bob' });
    });

    // Note: Testing actual timeout with supertest is challenging because
    // supertest doesn't provide a way to simulate slow data transmission.
    // The timeout protection is tested in unit tests instead.
  });

  describe('Invalid Content-Type Rejection', () => {
    it('should reject module with invalid content-type', () => {
      expect(() => {
        ToonModule.forRoot({
          contentType: 'text/toon\r\nX-Evil: injected',
        });
      }).toThrow(/control characters or newlines/);
    });

    it('should reject module with malformed MIME type', () => {
      expect(() => {
        ToonModule.forRoot({
          contentType: 'not-valid',
        });
      }).toThrow(/valid MIME type/);
    });
  });

  describe('Production Error Sanitization', () => {
    let prodApp: INestApplication;

    beforeAll(async () => {
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'production';

      try {
        const moduleFixture: TestingModule = await Test.createTestingModule({
          imports: [SecurityTestModule],
        }).compile();

        prodApp = moduleFixture.createNestApplication();

        const toonBodyParserMiddleware = prodApp.get(ToonBodyParserMiddleware);
        prodApp.use(toonBodyParserMiddleware.use.bind(toonBodyParserMiddleware));

        await prodApp.init();
      } finally {
        process.env.NODE_ENV = originalEnv;
      }
    });

    afterAll(async () => {
      await prodApp?.close();
    });

    it('should not expose error details in production', async () => {
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'production';

      try {
        // Use empty string which is explicitly rejected by ToonSerializerService
        const invalidData = '';

        const response = await request(prodApp.getHttpServer())
          .post('/security/data')
          .set('Content-Type', 'text/toon')
          .send(invalidData)
          .expect(400);

        expect(response.body.error).toBe('BadRequestError');
        expect(response.body.message).toBe('Failed to parse TOON request body');
        expect(response.body.details).toBeUndefined();
        expect(response.body.originalError).toBeUndefined();
      } finally {
        process.env.NODE_ENV = originalEnv;
      }
    });
  });

  describe('Accept Header Limits', () => {
    it('should handle large Accept headers gracefully', async () => {
      const validData = 'name: Charlie';

      // Create a large but valid Accept header
      const largeAcceptHeader = Array.from(
        { length: 15 },
        (_, i) => `type${i}/subtype${i};q=0.${9 - (i % 10)}`,
      ).join(',');

      const response = await request(app.getHttpServer())
        .post('/security/data')
        .set('Content-Type', 'text/toon')
        .set('Accept', largeAcceptHeader)
        .send(validData)
        .expect(201);

      expect(response.body.received).toEqual({ name: 'Charlie' });
    });
  });
});
