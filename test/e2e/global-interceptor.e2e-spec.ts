import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { ToonModule } from '../../src/toon.module';
import { Controller, Get, Module } from '@nestjs/common';

@Controller('test')
class TestController {
  @Get('users')
  getUsers() {
    return {
      users: [
        { id: 1, name: 'Alice', email: 'alice@example.com' },
        { id: 2, name: 'Bob', email: 'bob@example.com' },
      ],
    };
  }

  @Get('simple')
  getSimple() {
    return { message: 'Hello World' };
  }
}

@Module({
  imports: [
    ToonModule.forRoot({
      global: true,
      enableResponseSerialization: true,
    }),
  ],
  controllers: [TestController],
})
class TestAppModule {}

describe('Global Interceptor E2E', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [TestAppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  describe('Content Negotiation', () => {
    it('should return TOON when Accept: text/toon', () => {
      return request(app.getHttpServer())
        .get('/test/users')
        .set('Accept', 'text/toon')
        .expect(200)
        .expect('Content-Type', /text\/toon/)
        .then((response) => {
          // TOON format should contain user data
          expect(response.text).toContain('users');
          expect(response.text).toContain('Alice');
          expect(response.text).toContain('Bob');
        });
    });

    it('should return JSON when Accept: application/json', () => {
      return request(app.getHttpServer())
        .get('/test/users')
        .set('Accept', 'application/json')
        .expect(200)
        .expect('Content-Type', /json/)
        .then((response) => {
          expect(response.body).toEqual({
            users: [
              { id: 1, name: 'Alice', email: 'alice@example.com' },
              { id: 2, name: 'Bob', email: 'bob@example.com' },
            ],
          });
        });
    });

    it('should return JSON for wildcard Accept: */* (TOON must be explicitly requested)', () => {
      return request(app.getHttpServer())
        .get('/test/users')
        .set('Accept', '*/*')
        .expect(200)
        .expect('Content-Type', /json/);
    });

    it('should return JSON when no Accept header', () => {
      return request(app.getHttpServer())
        .get('/test/simple')
        .expect(200)
        .expect('Content-Type', /json/);
    });
  });
});
