import { UseInterceptors, applyDecorators, SetMetadata } from '@nestjs/common';
import { ToonResponseInterceptor } from '../interceptors/toon-response.interceptor';
import { TOON_ENABLED_METADATA } from '../constants/toon.constants';

/**
 * Decorator to enable TOON serialization for specific endpoints
 * Use this when you don't want global TOON support
 *
 * @example
 * @Controller('users')
 * export class UsersController {
 *   @Get()
 *   @UseToon()
 *   findAll() {
 *     return this.usersService.findAll();
 *   }
 * }
 */
export function UseToon() {
  return applyDecorators(
    SetMetadata(TOON_ENABLED_METADATA, true),
    UseInterceptors(ToonResponseInterceptor),
  );
}
