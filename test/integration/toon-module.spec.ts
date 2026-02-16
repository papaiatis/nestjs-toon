import { Test, TestingModule } from '@nestjs/testing';
import { vi } from 'vitest';
import { ToonModule } from '../../src/toon.module';
import { ToonSerializerService } from '../../src/services/toon-serializer.service';
import { ToonResponseInterceptor } from '../../src/interceptors/toon-response.interceptor';
import { MODULE_OPTIONS_TOKEN as TOON_MODULE_OPTIONS } from '../../src/toon.module-definition';

describe('ToonModule Integration', () => {
  describe('forRoot()', () => {
    it('should register module with default options', async () => {
      const module: TestingModule = await Test.createTestingModule({
        imports: [ToonModule.forRoot()],
      }).compile();

      expect(module).toBeDefined();
      expect(module.get(ToonSerializerService)).toBeDefined();
      expect(module.get(ToonResponseInterceptor)).toBeDefined();
    });

    it('should register module with custom options', async () => {
      const options = {
        enableResponseSerialization: true,
        enableRequestDeserialization: false,
        errorHandling: 'log-and-fallback' as const,
      };

      const module: TestingModule = await Test.createTestingModule({
        imports: [ToonModule.forRoot(options)],
      }).compile();

      const moduleOptions = module.get(TOON_MODULE_OPTIONS);
      expect(moduleOptions).toEqual(options);
    });

    it('should export ToonSerializerService for dependency injection', async () => {
      const module: TestingModule = await Test.createTestingModule({
        imports: [ToonModule.forRoot()],
      }).compile();

      const service = module.get(ToonSerializerService);
      expect(service).toBeInstanceOf(ToonSerializerService);
    });

    it('should export ToonResponseInterceptor for manual use', async () => {
      const module: TestingModule = await Test.createTestingModule({
        imports: [ToonModule.forRoot()],
      }).compile();

      const interceptor = module.get(ToonResponseInterceptor);
      expect(interceptor).toBeInstanceOf(ToonResponseInterceptor);
    });
  });

  describe('forRootAsync()', () => {
    it('should register module with factory', async () => {
      const module: TestingModule = await Test.createTestingModule({
        imports: [
          ToonModule.forRootAsync({
            useFactory: () => ({
              enableResponseSerialization: true,
              errorHandling: 'silent',
            }),
          }),
        ],
      }).compile();

      expect(module).toBeDefined();
      expect(module.get(ToonSerializerService)).toBeDefined();
    });

    it('should inject dependencies into factory', async () => {
      const mockFactory = vi.fn().mockReturnValue({
        errorHandling: 'log-and-fallback',
      });

      const module: TestingModule = await Test.createTestingModule({
        imports: [
          ToonModule.forRootAsync({
            useFactory: mockFactory,
          }),
        ],
      }).compile();

      expect(module).toBeDefined();
      expect(mockFactory).toHaveBeenCalled();
      const options = module.get(TOON_MODULE_OPTIONS);
      expect(options.errorHandling).toBe('log-and-fallback');
    });
  });

  describe('Module exports', () => {
    it('should allow services to be imported in other modules', async () => {
      const appModule = await Test.createTestingModule({
        imports: [ToonModule.forRoot()],
      }).compile();

      const service = appModule.get(ToonSerializerService);
      expect(service).toBeDefined();
      expect(typeof service.encode).toBe('function');
      expect(typeof service.decode).toBe('function');
    });
  });
});
