import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { ToonModule } from '../../src/toon.module';
import { UseToon } from '../../src/decorators/use-toon.decorator';
import { Controller, Get, Module } from '@nestjs/common';

@Controller('selective')
class SelectiveController {
  @Get('with-toon')
  @UseToon()
  withToon() {
    return { message: 'With TOON' };
  }

  @Get('without-toon')
  withoutToon() {
    return { message: 'Without TOON' };
  }
}

@Module({
  imports: [
    ToonModule.forRoot({
      global: false, // Not global, use decorator-based
      enableResponseSerialization: true,
    }),
  ],
  controllers: [SelectiveController],
})
class SelectiveAppModule {}

describe('Decorator-Based E2E', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [SelectiveAppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  describe('Selective TOON Support', () => {
    it('should serialize with TOON for @UseToon() decorated endpoint', () => {
      return request(app.getHttpServer())
        .get('/selective/with-toon')
        .set('Accept', 'text/toon')
        .expect(200)
        .expect('Content-Type', /text\/toon/)
        .then((response) => {
          expect(response.text).toContain('message');
          expect(response.text).toContain('With TOON');
        });
    });

    it('should return JSON for non-decorated endpoint even with Accept: text/toon', () => {
      return request(app.getHttpServer())
        .get('/selective/without-toon')
        .set('Accept', 'text/toon')
        .expect(200)
        .expect('Content-Type', /json/)
        .then((response) => {
          expect(response.body).toEqual({ message: 'Without TOON' });
        });
    });
  });
});
