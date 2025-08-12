# 🚀 pnpm + Node.js 22 + TypeScript Optimizations

## Overview

This document outlines specific optimizations and configurations for running tests with **pnpm**, **Node.js 22**, and **TypeScript**.

## Tech Stack Benefits

### 📦 pnpm Advantages

- **Faster installs**: Hard links and content-addressable storage
- **Disk efficiency**: Shared dependencies across projects
- **Strict**: Better dependency resolution
- **Monorepo support**: Built-in workspace support

### ⚡ Node.js 22 Features Used

- **Enhanced ESM support**: Better ES module handling
- **V8 improvements**: Faster JavaScript execution
- **Better TypeScript integration**: Native TypeScript performance
- **Improved startup time**: Faster application initialization
- **Enhanced debugging**: Better source map support

### 🎯 TypeScript Benefits

- **Strict type checking**: Catch errors at compile time
- **Path mapping**: Clean import aliases with `@/*`
- **Decorator support**: Full dependency injection support
- **Advanced generics**: Type-safe repository patterns

## Optimized Commands

### Development

```bash
# Install dependencies (fast with pnpm)
pnpm install

# Run tests in development
pnpm test

# Run tests with coverage
pnpm run test:coverage

# Run tests with UI (great for debugging)
pnpm run test:ui

# Watch mode for TDD
pnpm test -- --watch
```

### Performance Testing

```bash
# Run tests with performance monitoring
pnpm test -- --reporter=verbose --coverage

# Run specific test file
pnpm test src/tests/unit/dashboard-campaign-info.service.test.ts

# Run integration tests only
pnpm test src/tests/integration/

# Debug specific test
pnpm test -- --inspect-brk src/tests/unit/dashboard-campaign-info.service.test.ts
```

### CI/CD Optimized

```bash
# Install with lockfile (deterministic)
pnpm install --frozen-lockfile

# Run tests with JSON output for CI
pnpm run test:coverage -- --reporter=json --outputFile=test-results.json

# Type check only
pnpm run type-check

# Lint check
pnpm run lint
```

## Configuration Optimizations

### package.json Scripts

```json
{
  "scripts": {
    "test": "vitest",
    "test:unit": "vitest src/tests/unit",
    "test:integration": "vitest src/tests/integration",
    "test:coverage": "vitest --coverage",
    "test:ui": "vitest --ui",
    "test:watch": "vitest --watch",
    "test:debug": "vitest --inspect-brk",
    "test:ci": "vitest --run --coverage --reporter=json"
  }
}
```

### .npmrc for pnpm Optimization

```ini
# .npmrc
auto-install-peers=true
dedupe-peer-dependents=false
enable-pre-post-scripts=true
fund=false
save-exact=true
strict-peer-dependencies=false
```

### Node.js 22 Environment Variables

```bash
# Memory optimization
NODE_OPTIONS="--max-old-space-size=4096 --enable-source-maps"

# V8 optimizations
NODE_V8_COVERAGE=1

# ESM support
NODE_LOADER=tsx/esm
```

## Performance Benchmarks

### Typical Performance (Node.js 22 + pnpm)

- **Install time**: ~2-3 seconds (with cache)
- **Test startup**: ~500ms
- **Unit tests**: ~50ms per test
- **Integration tests**: ~200-500ms per test
- **Coverage generation**: ~1-2 seconds

### Optimization Tips

#### 1. pnpm Store Optimization

```bash
# Clean pnpm store periodically
pnpm store prune

# Use local store for CI
pnpm config set store-dir .pnpm-store
```

#### 2. Node.js 22 Memory Management

```bash
# Increase memory for large test suites
NODE_OPTIONS="--max-old-space-size=8192"

# Enable garbage collection optimization
NODE_OPTIONS="--gc-strategy=adaptive"
```

#### 3. TypeScript Compilation

```bash
# Use SWC for faster TypeScript compilation
pnpm add -D @swc/core @vitest/environment-node

# Enable incremental compilation
tsc --incremental --noEmit
```

## Database Performance

### SQLite In-Memory Optimization

```typescript
// optimized for Node.js 22
const dbConfig = {
  dialect: 'sqlite',
  storage: ':memory:',
  logging: false,
  benchmark: false,
  pool: {
    max: 1,
    min: 0,
    acquire: 30000,
    idle: 10000,
  },
};
```

### Connection Pool Settings

```typescript
// Test environment optimized pools
DB_POOL_MIN = 0;
DB_POOL_MAX = 5;
DB_IDLE_TIMEOUT = 10000;
DB_ACQUIRE_TIMEOUT = 30000;
```

## Debugging Setup

### VS Code Configuration

```json
// .vscode/launch.json
{
  "type": "node",
  "request": "launch",
  "name": "Debug Tests",
  "program": "${workspaceFolder}/node_modules/.bin/vitest",
  "args": ["--inspect-brk", "--no-coverage"],
  "console": "integratedTerminal",
  "envFile": "${workspaceFolder}/.env.test"
}
```

### Chrome DevTools

```bash
# Start debugging session
pnpm test -- --inspect-brk

# Open Chrome and navigate to:
chrome://inspect
```

## CI/CD Optimization

### GitHub Actions Example

```yaml
name: Test Suite
on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    strategy:
      matrix:
        node-version: [22.x]

    steps:
      - uses: actions/checkout@v4

      - uses: pnpm/action-setup@v2
        with:
          version: latest

      - uses: actions/setup-node@v4
        with:
          node-version: ${{ matrix.node-version }}
          cache: 'pnpm'

      - name: Install dependencies
        run: pnpm install --frozen-lockfile

      - name: Type check
        run: pnpm run type-check

      - name: Lint
        run: pnpm run lint

      - name: Test with coverage
        run: pnpm run test:coverage

      - name: Upload coverage
        uses: codecov/codecov-action@v3
```

## Troubleshooting

### Common Issues

#### 1. pnpm Module Resolution

```bash
# If modules aren't found
pnpm install
pnpm rebuild

# Clear pnpm cache
pnpm store prune
rm -rf node_modules .pnpm-store
pnpm install
```

#### 2. Node.js 22 ESM Issues

```typescript
// Use proper ESM imports
import { createApp } from '@/server.js'; // Note .js extension

// Or configure in package.json
{
  "type": "module",
  "exports": {
    ".": "./dist/index.js"
  }
}
```

#### 3. TypeScript Path Resolution

```typescript
// tsconfig.json
{
  "compilerOptions": {
    "moduleResolution": "bundler",
    "allowImportingTsExtensions": true,
    "paths": {
      "@/*": ["./src/*"]
    }
  }
}
```

#### 4. Test Isolation Issues

```typescript
// Ensure proper cleanup
afterEach(async () => {
  await clearDatabase();
  vi.clearAllMocks();
});
```

## Best Practices

### ✅ Recommended

- Use `pnpm install --frozen-lockfile` in CI
- Set `NODE_ENV=test` explicitly
- Use in-memory SQLite for speed
- Enable source maps for debugging
- Use strict TypeScript configuration
- Implement proper test isolation

### ❌ Avoid

- Mixing npm and pnpm commands
- Using `--force` flag in CI
- Sharing test state between tests
- Using real databases in unit tests
- Ignoring TypeScript strict mode
- Skipping test cleanup

## Performance Monitoring

### Test Execution Time

```bash
# Monitor test performance
pnpm test -- --reporter=verbose --coverage

# Profile specific tests
pnpm test -- --inspect --no-coverage src/tests/unit/
```

### Memory Usage

```bash
# Monitor memory during tests
NODE_OPTIONS="--expose-gc --inspect" pnpm test

# Check for memory leaks
pnpm test -- --reporter=verbose --coverage --pool=forks
```

This configuration provides optimal performance for the **pnpm + Node.js 22 + TypeScript** stack while maintaining reliability and developer experience.
