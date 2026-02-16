import { ConfigurableModuleBuilder } from '@nestjs/common';
import { ToonModuleOptions } from './interfaces/toon-module-options.interface';

/**
 * ConfigurableModuleBuilder generates MODULE_OPTIONS_TOKEN and ConfigurableModuleClass
 * This provides forRoot() and forRootAsync() methods automatically
 */
export const { ConfigurableModuleClass, MODULE_OPTIONS_TOKEN } =
  new ConfigurableModuleBuilder<ToonModuleOptions>({
    moduleName: 'Toon',
  })
    .setClassMethodName('forRoot')
    .setFactoryMethodName('createToonOptions')
    .build();
