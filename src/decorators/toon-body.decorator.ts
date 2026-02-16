import { createParamDecorator, ExecutionContext } from '@nestjs/common';

/**
 * Parameter decorator for extracting TOON request bodies
 * Works like @Body() but specifically for TOON-parsed requests
 *
 * @example
 * @Post()
 * create(@ToonBody() createUserDto: CreateUserDto) {
 *   return this.usersService.create(createUserDto);
 * }
 */
export const ToonBody = createParamDecorator((data: string | undefined, ctx: ExecutionContext) => {
  const request = ctx.switchToHttp().getRequest();
  const body = request.body;

  // If a specific property is requested, return it
  if (data) {
    return body?.[data];
  }

  // Otherwise return the entire body
  return body;
});
