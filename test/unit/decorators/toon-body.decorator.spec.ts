import { Controller, Post } from '@nestjs/common';
import { ToonBody } from '../../../src/decorators/toon-body.decorator';

describe('ToonBody Decorator', () => {
  it('should be defined', () => {
    expect(ToonBody).toBeDefined();
    expect(typeof ToonBody).toBe('function');
  });

  it('should work as parameter decorator in controller', () => {
    @Controller('test')
    class TestController {
      @Post()
      create(@ToonBody() body: any) {
        return body;
      }

      @Post('name')
      createWithName(@ToonBody('name') name: string) {
        return { name };
      }

      @Post('partial')
      createPartial(@ToonBody('email') email: string) {
        return { email };
      }
    }

    const controller = new TestController();
    expect(controller).toBeDefined();
    expect(controller.create).toBeDefined();
    expect(controller.createWithName).toBeDefined();
    expect(controller.createPartial).toBeDefined();
  });

  it('should create a decorator function', () => {
    const decorator = ToonBody();
    expect(typeof decorator).toBe('function');
  });

  it('should create a decorator function with property name', () => {
    const decorator = ToonBody('name');
    expect(typeof decorator).toBe('function');
  });
});
