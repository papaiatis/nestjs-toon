import { Test, TestingModule } from '@nestjs/testing';
import { ExecutionContext, CallHandler } from '@nestjs/common';
import { of } from 'rxjs';
import { vi } from 'vitest';
import { ToonResponseInterceptor } from '../../../src/interceptors/toon-response.interceptor';
import { ToonSerializerService } from '../../../src/services/toon-serializer.service';
import { TOON_FALLBACK_HEADER } from '../../../src/constants/toon.constants';
import { MODULE_OPTIONS_TOKEN as TOON_MODULE_OPTIONS } from '../../../src/toon.module-definition';
import { ToonModuleOptions } from '../../../src/interfaces/toon-module-options.interface';

describe('ToonResponseInterceptor', () => {
  let interceptor: ToonResponseInterceptor;
  let serializerService: ToonSerializerService;
  let mockExecutionContext: Partial<ExecutionContext>;
  let mockCallHandler: Partial<CallHandler>;
  let mockRequest: any;
  let mockResponse: any;

  beforeEach(async () => {
    mockRequest = {
      headers: {},
      method: 'GET',
      url: '/api/test',
    };

    mockResponse = {
      setHeader: vi.fn(),
    };

    mockExecutionContext = {
      switchToHttp: vi.fn().mockReturnValue({
        getRequest: () => mockRequest,
        getResponse: () => mockResponse,
      }),
    };

    mockCallHandler = {
      handle: vi.fn().mockReturnValue(of({ test: 'data' })),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ToonResponseInterceptor,
        ToonSerializerService,
        {
          provide: TOON_MODULE_OPTIONS,
          useValue: {},
        },
      ],
    }).compile();

    interceptor = module.get<ToonResponseInterceptor>(ToonResponseInterceptor);
    serializerService = module.get<ToonSerializerService>(ToonSerializerService);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should be defined', () => {
    expect(interceptor).toBeDefined();
  });

  describe('Content Negotiation', () => {
    it('should pass through when Accept header does not include text/toon', () => {
      return new Promise<void>((resolve) => {
        mockRequest.headers.accept = 'application/json';

        interceptor
          .intercept(mockExecutionContext as ExecutionContext, mockCallHandler as CallHandler)
          .subscribe({
            next: (result) => {
              expect(result).toEqual({ test: 'data' });
              expect(mockResponse.setHeader).not.toHaveBeenCalled();
              resolve();
            },
          });
      });
    });

    it('should serialize to TOON when Accept header includes text/toon', () => {
      return new Promise<void>((resolve) => {
        mockRequest.headers.accept = 'text/toon';
        vi.spyOn(serializerService, 'encode').mockReturnValue('test: data');

        interceptor
          .intercept(mockExecutionContext as ExecutionContext, mockCallHandler as CallHandler)
          .subscribe({
            next: (result) => {
              expect(result).toBe('test: data');
              expect(mockResponse.setHeader).toHaveBeenCalledWith('Content-Type', 'text/toon');
              expect(serializerService.encode).toHaveBeenCalledWith({ test: 'data' });
              resolve();
            },
          });
      });
    });

    it('should pass through for wildcard Accept header (TOON must be explicitly requested)', () => {
      return new Promise<void>((resolve) => {
        mockRequest.headers.accept = '*/*';

        interceptor
          .intercept(mockExecutionContext as ExecutionContext, mockCallHandler as CallHandler)
          .subscribe({
            next: (result) => {
              expect(result).toEqual({ test: 'data' });
              expect(mockResponse.setHeader).not.toHaveBeenCalled();
              resolve();
            },
          });
      });
    });

    it('should pass through when response serialization is disabled', async () => {
      const module = await Test.createTestingModule({
        providers: [
          ToonResponseInterceptor,
          ToonSerializerService,
          {
            provide: TOON_MODULE_OPTIONS,
            useValue: { enableResponseSerialization: false } as ToonModuleOptions,
          },
        ],
      }).compile();

      return new Promise<void>((resolve) => {
        const disabledInterceptor = module.get<ToonResponseInterceptor>(ToonResponseInterceptor);
        mockRequest.headers.accept = 'text/toon';

        disabledInterceptor
          .intercept(mockExecutionContext as ExecutionContext, mockCallHandler as CallHandler)
          .subscribe({
            next: (result) => {
              expect(result).toEqual({ test: 'data' });
              expect(mockResponse.setHeader).not.toHaveBeenCalled();
              resolve();
            },
          });
      });
    });
  });

  describe('Error Handling', () => {
    it('should throw error when errorHandling is "throw"', async () => {
      const module = await Test.createTestingModule({
        providers: [
          ToonResponseInterceptor,
          ToonSerializerService,
          {
            provide: TOON_MODULE_OPTIONS,
            useValue: { errorHandling: 'throw' } as ToonModuleOptions,
          },
        ],
      }).compile();

      return new Promise<void>((resolve, reject) => {
        const throwInterceptor = module.get<ToonResponseInterceptor>(ToonResponseInterceptor);
        const serializerSvc = module.get<ToonSerializerService>(ToonSerializerService);

        mockRequest.headers.accept = 'text/toon';
        vi.spyOn(serializerSvc, 'encode').mockImplementation(() => {
          throw new Error('Serialization failed');
        });

        throwInterceptor
          .intercept(mockExecutionContext as ExecutionContext, mockCallHandler as CallHandler)
          .subscribe({
            next: () => {
              reject(new Error('Should have thrown error'));
            },
            error: (error) => {
              expect(error.message).toBe('Serialization failed');
              resolve();
            },
          });
      });
    });

    it('should fallback to JSON when errorHandling is "log-and-fallback"', async () => {
      const module = await Test.createTestingModule({
        providers: [
          ToonResponseInterceptor,
          ToonSerializerService,
          {
            provide: TOON_MODULE_OPTIONS,
            useValue: { errorHandling: 'log-and-fallback' } as ToonModuleOptions,
          },
        ],
      }).compile();

      return new Promise<void>((resolve) => {
        const fallbackInterceptor = module.get<ToonResponseInterceptor>(ToonResponseInterceptor);
        const serializerSvc = module.get<ToonSerializerService>(ToonSerializerService);

        mockRequest.headers.accept = 'text/toon';
        vi.spyOn(serializerSvc, 'encode').mockImplementation(() => {
          throw new Error('Serialization failed');
        });

        fallbackInterceptor
          .intercept(mockExecutionContext as ExecutionContext, mockCallHandler as CallHandler)
          .subscribe({
            next: (result) => {
              expect(result).toEqual({ test: 'data' });
              expect(mockResponse.setHeader).toHaveBeenCalledWith(
                'Content-Type',
                'application/json',
              );
              expect(mockResponse.setHeader).toHaveBeenCalledWith(TOON_FALLBACK_HEADER, 'true');
              resolve();
            },
          });
      });
    });
  });

  describe('Custom Content Type', () => {
    it('should use custom content type from options', async () => {
      const module = await Test.createTestingModule({
        providers: [
          ToonResponseInterceptor,
          ToonSerializerService,
          {
            provide: TOON_MODULE_OPTIONS,
            useValue: { contentType: 'application/custom' } as ToonModuleOptions,
          },
        ],
      }).compile();

      return new Promise<void>((resolve) => {
        const customInterceptor = module.get<ToonResponseInterceptor>(ToonResponseInterceptor);
        const serializerSvc = module.get<ToonSerializerService>(ToonSerializerService);

        mockRequest.headers.accept = 'application/custom';
        vi.spyOn(serializerSvc, 'encode').mockReturnValue('test: data');

        customInterceptor
          .intercept(mockExecutionContext as ExecutionContext, mockCallHandler as CallHandler)
          .subscribe({
            next: () => {
              expect(mockResponse.setHeader).toHaveBeenCalledWith(
                'Content-Type',
                'application/custom',
              );
              resolve();
            },
          });
      });
    });
  });
});
