# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.1.0] - 2025-02-16

### Added
- Initial release of nestjs-toon library
- Complete NestJS integration for TOON (Token-Oriented Object Notation) format
- Global and route-level configuration support via `ToonModule.forRoot()` and `ToonModule.forRootAsync()`
- Automatic content negotiation based on `Accept` header
- Request body deserialization middleware with `@ToonBody()` decorator
- Response serialization interceptor with `@UseToon()` decorator
- Flexible error handling modes: throw, log-and-fallback, silent
- Comprehensive security protections:
  - Request body size limits (prevents memory exhaustion)
  - Request parsing timeout (prevents slow-loris attacks)
  - Content-Type validation (prevents header injection)
  - Accept header limits (prevents DoS attacks)
  - Automatic error sanitization in production (prevents information disclosure)
- 111 unit and E2E tests with 96%+ coverage
- Example application demonstrating usage patterns
- Complete API documentation and usage guide

[0.1.0]: https://github.com/papaiatis/nestjs-toon/releases/tag/v0.1.0
