import { Controller, Get } from '@nestjs/common';
import { UseToon } from '../../../src/decorators/use-toon.decorator';

describe('UseToon Decorator', () => {
  it('should be defined', () => {
    expect(UseToon).toBeDefined();
  });

  it('should work as method decorator in controller', () => {
    @Controller('test')
    class TestController {
      @Get()
      @UseToon()
      withToon() {
        return { test: 'data' };
      }

      @Get('no-toon')
      withoutToon() {
        return { test: 'data' };
      }
    }

    const controller = new TestController();
    expect(controller).toBeDefined();
    expect(controller.withToon).toBeDefined();
    expect(controller.withoutToon).toBeDefined();
  });
});
