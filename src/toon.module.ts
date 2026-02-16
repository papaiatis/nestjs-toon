import { Module, DynamicModule, Provider, OnModuleInit, Inject, Optional } from '@nestjs/common';
import { APP_INTERCEPTOR } from '@nestjs/core';
import { ConfigurableModuleClass, MODULE_OPTIONS_TOKEN } from './toon.module-definition';
import { ToonSerializerService } from './services/toon-serializer.service';
import { ToonResponseInterceptor } from './interceptors/toon-response.interceptor';
import { ToonModuleOptions } from './interfaces/toon-module-options.interface';
import { validateContentType } from './utils/validation.util';

/**
 * Main module for TOON serialization support in NestJS
 *
 * @example
 * // Global registration
 * ToonModule.forRoot({
 *   global: true,
 *   enableResponseSerialization: true,
 * })
 *
 * @example
 * // Async registration
 * ToonModule.forRootAsync({
 *   imports: [ConfigModule],
 *   useFactory: (config: ConfigService) => ({
 *     global: true,
 *   }),
 *   inject: [ConfigService],
 * })
 */
@Module({})
export class ToonModule extends ConfigurableModuleClass implements OnModuleInit {
  constructor(
    @Optional()
    @Inject(MODULE_OPTIONS_TOKEN)
    private readonly options?: ToonModuleOptions,
  ) {
    super();
  }

  /**
   * Validate module options after DI resolves them.
   * Covers both forRoot and forRootAsync paths.
   */
  onModuleInit() {
    if (this.options?.contentType) {
      validateContentType(this.options.contentType);
    }
  }

  /**
   * Register module synchronously with configuration
   * @param options - Module configuration options
   * @returns Dynamic module with providers and exports
   */
  static override forRoot(options: ToonModuleOptions = {}): DynamicModule {
    // Fail fast for sync registration -- async path is validated in onModuleInit
    if (options.contentType) {
      validateContentType(options.contentType);
    }

    const dynamicModule = super.forRoot(options);

    const providers: Provider[] = [
      ToonSerializerService,
      ToonResponseInterceptor,
      ...(dynamicModule.providers || []),
    ];

    if (options.global) {
      providers.push({
        provide: APP_INTERCEPTOR,
        useClass: ToonResponseInterceptor,
      });
    }

    return {
      ...dynamicModule,
      module: ToonModule,
      providers,
      exports: [ToonSerializerService, ToonResponseInterceptor, MODULE_OPTIONS_TOKEN],
    };
  }

  /**
   * Register module asynchronously with configuration factory
   * @param options - Async module configuration options
   * @returns Dynamic module with async providers
   */
  static override forRootAsync(
    options: Parameters<typeof ConfigurableModuleClass.forRootAsync>[0],
  ): DynamicModule {
    const dynamicModule = super.forRootAsync(options);

    return {
      ...dynamicModule,
      module: ToonModule,
      providers: [
        ToonSerializerService,
        ToonResponseInterceptor,
        ...(dynamicModule.providers || []),
      ],
      exports: [ToonSerializerService, ToonResponseInterceptor, MODULE_OPTIONS_TOKEN],
    };
  }
}
