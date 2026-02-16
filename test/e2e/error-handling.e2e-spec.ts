import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { ToonModule } from '../../src/toon.module';
import { Controller, Get, Module } from '@nestjs/common';

@Controller('error-test')
class ErrorTestController {
  @Get('data')
  getData() {
    return { test: 'data' };
  }

  @Get('circular')
  getCircular() {
    // Create circular reference - will fail TOON serialization
    const obj: any = { name: 'test' };
    obj.self = obj;
    return obj;
  }

  @Get('normal')
  getNormal() {
    // Normal data that can be serialized to both TOON and JSON
    return { message: 'normal data' };
  }
}

describe('Error Handling E2E', () => {
  describe('Throw Mode', () => {
    let app: INestApplication;

    beforeAll(async () => {
      @Module({
        imports: [
          ToonModule.forRoot({
            global: true,
            errorHandling: 'throw',
          }),
        ],
        controllers: [ErrorTestController],
      })
      class ThrowAppModule {}

      const moduleFixture: TestingModule = await Test.createTestingModule({
        imports: [ThrowAppModule],
      }).compile();

      app = moduleFixture.createNestApplication();
      await app.init();
    });

    afterAll(async () => {
      await app.close();
    });

    it('should throw error when serialization fails (circular reference)', () => {
      return request(app.getHttpServer())
        .get('/error-test/circular')
        .set('Accept', 'text/toon')
        .expect(500);
    });

    it('should succeed when serialization works', () => {
      return request(app.getHttpServer())
        .get('/error-test/data')
        .set('Accept', 'text/toon')
        .expect(200)
        .expect('Content-Type', /text\/toon/);
    });
  });

  describe('Log-and-Fallback Mode', () => {
    let app: INestApplication;

    beforeAll(async () => {
      @Module({
        imports: [
          ToonModule.forRoot({
            global: true,
            errorHandling: 'log-and-fallback',
          }),
        ],
        controllers: [ErrorTestController],
      })
      class FallbackAppModule {}

      const moduleFixture: TestingModule = await Test.createTestingModule({
        imports: [FallbackAppModule],
      }).compile();

      app = moduleFixture.createNestApplication();
      await app.init();
    });

    afterAll(async () => {
      await app.close();
    });

    it('should successfully serialize normal data to TOON', () => {
      return request(app.getHttpServer())
        .get('/error-test/normal')
        .set('Accept', 'text/toon')
        .expect(200)
        .expect('Content-Type', /text\/toon/)
        .then((response) => {
          expect(response.text).toContain('message');
          expect(response.text).toContain('normal data');
        });
    });
  });

  describe('Silent Mode', () => {
    let app: INestApplication;

    beforeAll(async () => {
      @Module({
        imports: [
          ToonModule.forRoot({
            global: true,
            errorHandling: 'silent',
          }),
        ],
        controllers: [ErrorTestController],
      })
      class SilentAppModule {}

      const moduleFixture: TestingModule = await Test.createTestingModule({
        imports: [SilentAppModule],
      }).compile();

      app = moduleFixture.createNestApplication();
      await app.init();
    });

    afterAll(async () => {
      await app.close();
    });

    it('should successfully serialize normal data to TOON', () => {
      return request(app.getHttpServer())
        .get('/error-test/normal')
        .set('Accept', 'text/toon')
        .expect(200)
        .expect('Content-Type', /text\/toon/)
        .then((response) => {
          expect(response.text).toContain('message');
        });
    });
  });
});
