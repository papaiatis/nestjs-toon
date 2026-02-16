# Contributing to nestjs-toon

Thanks for your interest in contributing! Here's how to get started.

## Development Setup

```bash
# Fork and clone
git clone https://github.com/papaiatis/nestjs-toon.git
cd nestjs-toon

# Install dependencies
npm install

# Run tests
npm test
npm run test:e2e

# Build
npm run build
```

## Making Changes

1. **Create a branch:**
   ```bash
   git checkout -b feature/your-feature
   ```

2. **Make your changes** and add tests

3. **Verify everything works:**
   ```bash
   npm test && npm run test:e2e && npm run lint && npm run build
   ```

4. **Commit using conventional commits:**
   ```bash
   git commit -m "feat: add new feature"
   git commit -m "fix: resolve bug"
   git commit -m "docs: update README"
   ```

5. **Push and create a Pull Request:**
   ```bash
   git push origin feature/your-feature
   ```

## Pull Request Requirements

- ✅ Tests pass
- ✅ Code is linted
- ✅ Builds successfully
- ✅ Documentation updated if needed

## Commit Convention

Use [Conventional Commits](https://www.conventionalcommits.org/):
- `feat:` - New feature
- `fix:` - Bug fix
- `docs:` - Documentation
- `test:` - Tests
- `refactor:` - Code refactoring
- `chore:` - Maintenance

## Questions?

Open an issue at https://github.com/papaiatis/nestjs-toon/issues

## License

By contributing, you agree your code will be licensed under MIT.
