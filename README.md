# nestjs-toon

[![npm version](https://badge.fury.io/js/nestjs-toon.svg)](https://badge.fury.io/js/nestjs-toon)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

NestJS library for [TOON (Token-Oriented Object Notation)](https://toonformat.dev/) serialization support. Reduce API response tokens by 30-60% for LLM-powered applications.

> **Built on [@toon-format/toon](https://github.com/toon-format/toon)** - This library provides NestJS integration for the official TOON format library. Full credit to the TOON format creators for the core serialization implementation.

## What is TOON?

TOON (Token-Oriented Object Notation) is a compact, human-readable format designed specifically for Large Language Model contexts. It merges YAML-style indentation with CSV-like tabular arrays to minimize token usage while maintaining structure clarity.

**Key Benefits:**
- 📉 **30-60% fewer tokens** compared to JSON
- 📊 **Best for uniform arrays** of objects (common API responses)
- 🔄 **Lossless round-trips** - deterministic encoding/decoding
- 🎯 **Drop-in replacement** for JSON with content negotiation

## Installation

```bash
npm install nestjs-toon
# or
yarn add nestjs-toon
# or
pnpm add nestjs-toon
```

## Quick Start

### 1. Global Configuration

Register the module globally in your app:

```typescript
// app.module.ts
import { Module } from '@nestjs/common';
import { ToonModule } from 'nestjs-toon';

@Module({
  imports: [
    ToonModule.forRoot({
      global: true,
      enableResponseSerialization: true,
    }),
  ],
})
export class AppModule {}
```

### 2. Create a Controller

```typescript
// users.controller.ts
import { Controller, Get } from '@nestjs/common';

@Controller('users')
export class UsersController {
  @Get()
  findAll() {
    return {
      users: [
        { id: 1, name: 'Alice', email: 'alice@example.com', age: 30 },
        { id: 2, name: 'Bob', email: 'bob@example.com', age: 25 },
      ],
    };
  }
}
```

### 3. Test with cURL

**TOON Response:**
```bash
curl -H "Accept: text/toon" http://localhost:3000/users
```

```
users[2]{id,name,email,age}:
1,Alice,alice@example.com,30
2,Bob,bob@example.com,25
```

**JSON Response (default):**
```bash
curl -H "Accept: application/json" http://localhost:3000/users
```

```json
{
  "users": [
    { "id": 1, "name": "Alice", "email": "alice@example.com", "age": 30 },
    { "id": 2, "name": "Bob", "email": "bob@example.com", "age": 25 }
  ]
}
```

## Configuration Options

```typescript
interface ToonModuleOptions {
  // Enable response serialization (Object → TOON)
  enableResponseSerialization?: boolean; // default: true

  // Enable request deserialization (TOON → Object)
  enableRequestDeserialization?: boolean; // default: true

  // Apply interceptors globally
  global?: boolean; // default: false

  // Error handling strategy
  errorHandling?: 'throw' | 'log-and-fallback' | 'silent'; // default: 'throw'

  // Custom content type
  contentType?: string; // default: 'text/toon'

  // Max request body size in bytes
  maxBodySize?: number; // default: 102400 (100KB)

  // Request body parsing timeout in milliseconds
  parseTimeout?: number; // default: 30000 (30 seconds)

  // Sanitize error messages in production
  sanitizeErrors?: boolean; // default: true
}
```

## Integration Methods

### Method 1: Global Registration

Apply TOON serialization to all endpoints:

```typescript
ToonModule.forRoot({
  global: true,
  enableResponseSerialization: true,
  errorHandling: 'log-and-fallback',
})
```

### Method 2: Async Configuration

Use with ConfigModule for dynamic configuration:

```typescript
import { ConfigModule, ConfigService } from '@nestjs/config';

ToonModule.forRootAsync({
  imports: [ConfigModule],
  useFactory: (config: ConfigService) => ({
    global: config.get('TOON_GLOBAL') === 'true',
    enableResponseSerialization: true,
    errorHandling: config.get('TOON_ERROR_HANDLING') || 'throw',
  }),
  inject: [ConfigService],
})
```

### Method 3: Selective Endpoints

Use decorators for fine-grained control:

```typescript
import { Controller, Get } from '@nestjs/common';
import { UseToon } from 'nestjs-toon';

@Controller('data')
export class DataController {
  @Get()
  @UseToon() // Only this endpoint supports TOON
  getData() {
    return { items: [...] };
  }
}
```

## Content Negotiation

The library uses standard HTTP content negotiation via the `Accept` header:

| Accept Header | Response Format |
|--------------|-----------------|
| `text/toon` | TOON |
| `application/json` | JSON |
| `*/*` | JSON (TOON must be explicitly requested) |
| `text/*` | TOON |
| Not specified | JSON |

## Request Body Parsing

The library supports parsing TOON request bodies when `enableRequestDeserialization` is enabled:

### Sending TOON Data

```bash
curl -X POST http://localhost:3000/users \
  -H "Content-Type: text/toon" \
  -H "Accept: text/toon" \
  -d 'name: Alice
email: alice@example.com
age: 30'
```

### Using @ToonBody() Decorator

```typescript
import { Controller, Post } from '@nestjs/common';
import { ToonBody } from 'nestjs-toon';

@Controller('users')
export class UsersController {
  @Post()
  create(@ToonBody() createUserDto: CreateUserDto) {
    return this.usersService.create(createUserDto);
  }

  @Post('bulk')
  createBulk(@ToonBody('users') users: CreateUserDto[]) {
    // Extract specific property from TOON body
    return this.usersService.createMany(users);
  }
}
```

**Note:** The middleware automatically parses TOON bodies and populates `req.body`. You can use the standard `@Body()` decorator or the `@ToonBody()` decorator (they work the same way).

## Error Handling

Three error handling modes are available:

### 1. `throw` (default)

Throws exceptions on serialization errors:

```typescript
ToonModule.forRoot({
  errorHandling: 'throw',
})
```

### 2. `log-and-fallback`

Logs errors and falls back to JSON:

```typescript
ToonModule.forRoot({
  errorHandling: 'log-and-fallback',
})
```

Response headers on fallback:
- `Content-Type: application/json`
- `X-Toon-Fallback: true`

### 3. `silent`

Silently falls back to JSON without logging:

```typescript
ToonModule.forRoot({
  errorHandling: 'silent',
})
```

## Security Configuration

nestjs-toon includes built-in security protections against common web vulnerabilities. These protections are enabled by default but can be customized as needed.

### Request Body Size Limits

Prevent memory exhaustion by limiting the size of incoming TOON request bodies:

```typescript
ToonModule.forRoot({
  maxBodySize: 102400, // 100KB (default)
})
```

**Security benefit:** Protects against attackers sending extremely large payloads to consume server memory.

### Request Parsing Timeout

Prevent slow-loris attacks by setting a timeout for request body parsing:

```typescript
ToonModule.forRoot({
  parseTimeout: 30000, // 30 seconds (default)
})
```

**Security benefit:** Limits how long the server waits for a request body, preventing attackers from holding connections open indefinitely with slow data transmission.

### Production Error Sanitization

Automatically hide detailed error messages in production to prevent information disclosure:

```typescript
ToonModule.forRoot({
  sanitizeErrors: true, // default
})
```

When `NODE_ENV=production` and `sanitizeErrors: true`:
- ✅ Generic error messages are returned to clients
- ❌ Internal parser details are hidden
- ❌ Stack traces are not exposed

When `NODE_ENV=development` or `sanitizeErrors: false`:
- ✅ Detailed error messages help with debugging
- ✅ Original error details included in responses

**Security benefit:** Prevents attackers from gathering information about your internal implementation or discovering parser vulnerabilities through detailed error messages.

### Content-Type Validation

The module automatically validates custom content types to prevent HTTP header injection:

```typescript
// ✅ Valid
ToonModule.forRoot({
  contentType: 'text/toon',
})

// ✅ Valid
ToonModule.forRoot({
  contentType: 'application/x-custom+json',
})

// ❌ Throws error - contains newlines (header injection risk)
ToonModule.forRoot({
  contentType: 'text/toon\r\nX-Evil: injected',
})
```

**Security benefit:** Prevents HTTP response splitting and header injection attacks.

### Accept Header Limits

The content negotiation system enforces limits on Accept header parsing to prevent DoS attacks:

- Maximum Accept header size: 8KB (RFC 7230 recommendation)
- Maximum media types parsed: 20

**Security benefit:** Prevents CPU exhaustion from parsing maliciously large Accept headers.

### Security Best Practices

1. **Always use HTTPS in production** - TOON data is text-based and should be transmitted over encrypted connections
2. **Keep request body limits appropriate** - Set `maxBodySize` based on your actual needs (default 100KB is suitable for most APIs)
3. **Monitor timeout settings** - Adjust `parseTimeout` if you have legitimate use cases for slow connections, but keep it as low as practical
4. **Never disable error sanitization in production** - Keep `sanitizeErrors: true` when `NODE_ENV=production`
5. **Use standard NestJS security practices** - Apply helmet, CORS, rate limiting, and other standard security middleware

## Performance

### Token Reduction Examples

**100-item user array:**
- JSON: ~3,500 tokens
- TOON: ~1,400 tokens
- **Reduction: 60%**

**500 e-commerce orders:**
- JSON: ~11,842 tokens
- TOON: ~4,617 tokens
- **Reduction: 61%**

### When to Use TOON

✅ **Use TOON for:**
- Uniform arrays of objects (API lists, tables)
- LLM-powered applications where tokens matter
- Cost-sensitive AI workflows
- Large datasets with repeated structure

❌ **Stick with JSON for:**
- Deeply nested structures (>5 levels)
- Purely flat data (use CSV instead)
- Binary data or file uploads
- Legacy systems requiring JSON

## API Reference

### Exports

```typescript
// Module
export { ToonModule } from 'nestjs-toon';

// Services
export { ToonSerializerService } from 'nestjs-toon';

// Interceptors
export { ToonResponseInterceptor } from 'nestjs-toon';

// Middleware
export { ToonBodyParserMiddleware } from 'nestjs-toon';

// Decorators
export { UseToon, ToonBody } from 'nestjs-toon';

// Interfaces
export { ToonModuleOptions } from 'nestjs-toon';

// Constants
export {
  TOON_CONTENT_TYPE,
  TOON_MODULE_OPTIONS,
  TOON_ENABLED_METADATA,
  TOON_FALLBACK_HEADER,
} from 'nestjs-toon';

// Exceptions
export {
  ToonSerializationException,
  ToonDeserializationException,
} from 'nestjs-toon';

// Utilities
export {
  acceptsToon,
  parseAcceptHeader,
  negotiateContentType,
  handleToonError,
  isToonError,
} from 'nestjs-toon';
```

### ToonSerializerService

Injectable service for manual TOON encoding/decoding:

```typescript
import { Injectable } from '@nestjs/common';
import { ToonSerializerService } from 'nestjs-toon';

@Injectable()
export class MyService {
  constructor(private toonSerializer: ToonSerializerService) {}

  processData() {
    const data = { users: [...] };

    // Encode to TOON
    const toonString = this.toonSerializer.encode(data);

    // Decode from TOON
    const decoded = this.toonSerializer.decode(toonString);

    // Check if data can be serialized
    const canEncode = this.toonSerializer.canSerialize(data);
  }
}
```

### Middleware

The `ToonBodyParserMiddleware` is automatically configured when you import `ToonModule`. It:
- Parses request bodies with `Content-Type: text/toon`
- Enforces configurable size limits (default 100KB)
- Populates `req.body` with decoded TOON data
- Handles errors based on `errorHandling` configuration

**Manual Configuration** (optional):

```typescript
import { Module, NestModule, MiddlewareConsumer } from '@nestjs/common';
import { ToonBodyParserMiddleware } from 'nestjs-toon';

@Module({})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(ToonBodyParserMiddleware)
      .forRoutes('*'); // Apply to all routes
  }
}
```

## Example Application

See the [example/](./example) directory for a complete working example with:
- Global TOON configuration
- Multiple endpoints demonstrating different data structures
- cURL examples for testing
- Token comparison benchmarks

```bash
cd example
npm install
npm start
```

## Edge Cases

### Circular References

TOON cannot serialize circular references. They will throw `ToonSerializationException`:

```typescript
const data: any = { name: 'Alice' };
data.self = data; // Circular reference

// Throws: ToonSerializationException: Circular reference detected
```

### Type Preservation

TOON is lossy for some JavaScript types:
- ✅ Objects, arrays, strings, numbers, booleans, null
- ❌ Date objects (convert to ISO strings first)
- ❌ RegExp, functions, symbols, undefined

### Large Payloads

For responses >10MB, consider streaming (coming in future versions).

## Contributing

Contributions are welcome! Please see [CONTRIBUTING.md](./CONTRIBUTING.md) for guidelines.

## License

MIT © [Attila Papai](https://github.com/yourusername)

## Resources

- [TOON Format Official Website](https://toonformat.dev/)
- [TOON Specification](https://github.com/toon-format/spec)
- [NestJS Documentation](https://docs.nestjs.com/)
- [TypeScript SDK](https://github.com/toon-format/toon)

## Support

- 🐛 [Report bugs](https://github.com/yourusername/nestjs-toon/issues)
- 💡 [Request features](https://github.com/yourusername/nestjs-toon/issues)
- 📖 [Documentation](https://github.com/yourusername/nestjs-toon#readme)

---

Made with ❤️ for the NestJS and AI communities
