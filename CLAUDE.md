# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**nestjs-toon** is a NestJS library that provides TOON (Token-Oriented Object Notation) serialization support for API responses. TOON reduces token usage by 30-60% compared to JSON, making it ideal for LLM-powered applications.

- **Core dependency**: `@toon-format/toon` (official TOON library)
- **Content-Type**: `text/toon`
- **Integration**: HTTP content negotiation via `Accept` header

## Architecture

### Request/Response Flow

```
Client Request (Accept: text/toon)
    ↓
ToonBodyParserMiddleware (parses TOON request bodies)
    ↓
Controller
    ↓
ToonResponseInterceptor (serializes response to TOON if requested)
    ↓
Client Response (Content-Type: text/toon)
```

### Key Components

**ToonModule** - Entry point using NestJS `ConfigurableModuleBuilder`
- `forRoot()` - Sync configuration
- `forRootAsync()` - Async configuration with factories
- Exports: `MODULE_OPTIONS_TOKEN` (re-exported as `TOON_MODULE_OPTIONS` for compatibility)

**ToonSerializerService** - Wraps `@toon-format/toon` with error handling
- `encode()` - Object → TOON (applies `JSON.stringify()` first to handle class instances)
- `decode()` - TOON → Object
- `canSerialize()` - Circular reference detection

**ToonResponseInterceptor** - RxJS-based response transformation
- Checks `Accept` header via `acceptsToon()` util
- Serializes response if `text/toon` requested
- Handles errors per `errorHandling` config (throw/log-and-fallback/silent)

**ToonBodyParserMiddleware** - Express middleware for request parsing
- Runs before interceptors
- Parses `Content-Type: text/toon` bodies
- Enforces `maxBodySize` limit (default 100KB)

**Decorators**
- `@UseToon()` - Enable TOON for specific endpoints (alternative to global config)
- `@ToonBody()` - Extract TOON body (like `@Body()` for TOON requests)

### Content Negotiation Rules

| Accept Header | Response Format | Notes |
|--------------|-----------------|-------|
| `text/toon` | TOON | Explicit request |
| `text/*` | TOON | Type wildcard |
| `*/*` | JSON | TOON must be explicitly requested |
| Not specified | JSON | Default |

**Important**: `*/*` returns JSON (not TOON) to prevent breaking browser requests.

## Development Commands

### Build & Test
```bash
npm run build              # Compile TypeScript to dist/
npm test                   # Run unit tests (Vitest)
npm run test:watch         # Run tests in watch mode
npm run test:cov           # Run tests with coverage (thresholds: 90/90/90/80)
npm run test:e2e           # Run E2E tests
npm run test:ui            # Open Vitest UI
```

### Code Quality
```bash
npm run lint               # ESLint with auto-fix
npm run format             # Prettier formatting
```

### Example App
```bash
cd example && npm start    # Run example NestJS app on port 3000
curl -H "Accept: text/toon" http://localhost:3000/api/hikes
```

## Testing Architecture

- **Unit tests**: Use Vitest with real `@toon-format/toon` library (no mocks)
- **E2E tests**: Full NestJS app testing with supertest
- **Module tests**: Use `Test.createTestingModule()` (enabled via `unplugin-swc`)
- **Direct instantiation**: For middleware/simple services to avoid NestJS DI overhead

**Test configuration**:
- `vitest.config.ts` - Unit/integration tests
- `vitest.e2e.config.ts` - E2E tests
- `.swcrc` - SWC config for decorator metadata support

## Important Implementation Details

### Class Instance Serialization
The `encode()` method converts class instances to plain objects using `JSON.parse(JSON.stringify(data))` before TOON encoding. This:
- Handles NestJS DTOs and entity classes
- Detects circular references (throws clear error)
- Ensures TOON library receives plain objects

### Error Handling Modes
Configured via `errorHandling` option:
- `throw` - Throw exception, let global filter handle (default)
- `log-and-fallback` - Log error, return JSON with `X-Toon-Fallback: true` header
- `silent` - Return JSON silently without logging

### Module Options Token
Use `MODULE_OPTIONS_TOKEN` from `toon.module-definition.ts` in providers (internal).
The public API re-exports it as `TOON_MODULE_OPTIONS` for backward compatibility.

## Configuration Options

```typescript
interface ToonModuleOptions {
  global?: boolean;                          // Apply globally (default: false)
  enableResponseSerialization?: boolean;     // Enable TOON responses (default: true)
  enableRequestDeserialization?: boolean;    // Enable TOON requests (default: true)
  errorHandling?: 'throw' | 'log-and-fallback' | 'silent';  // default: 'throw'
  contentType?: string;                      // Custom MIME type (default: 'text/toon')
  maxBodySize?: number;                      // Max body size in bytes (default: 102400)
}
```
