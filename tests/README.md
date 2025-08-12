# 🧪 Test Suite Documentation

## Overview

This directory contains comprehensive test coverage for the Honeycomb API V2, including unit tests, integration tests, and test utilities.

**Tech Stack**: Node.js 22, TypeScript, pnpm, Vitest

## Test Structure

```
src/tests/
├── setup/                      # Test setup and utilities
│   ├── test-app.ts             # Test application factory
│   ├── global-setup.ts         # Global test configuration
│   └── README.md               # This file
├── unit/                       # Unit tests
│   └── dashboard-campaign-info.service.test.ts
├── integration/                # Integration tests
│   └── dashboard-campaign-info.api.test.ts
└── vitest.config.ts           # Vitest configuration
```

## Running Tests

### All Tests

```bash
pnpm test
```

### Unit Tests Only

```bash
pnpm test src/tests/unit
```

### Integration Tests Only

```bash
pnpm test src/tests/integration
```

### With Coverage

```bash
pnpm run test:coverage
```

### With UI

```bash
pnpm run test:ui
```

### Watch Mode

```bash
pnpm test -- --watch
```

## Test Types

### 🔧 Unit Tests

- **Location**: `src/tests/unit/`
- **Purpose**: Test individual components in isolation
- **Coverage**: Services, repositories, mappers, domain entities
- **Dependencies**: Mocked dependencies using Vitest mocks

### 🌐 Integration Tests

- **Location**: `src/tests/integration/`
- **Purpose**: Test full API endpoints with real database
- **Coverage**: HTTP requests, authentication, business flows
- **Dependencies**: Real test database, mock external services

## Test Utilities

### 🏗️ Test App Factory (`createTestApp`)

Creates a fully configured Fastify application for testing:

- ✅ Dependency injection setup
- ✅ Database connection
- ✅ Model registration
- ✅ Route configuration
- ✅ Middleware setup

```typescript
const testApp = await createTestApp();
// Use testApp.app for HTTP injection
await testApp.cleanup(); // Clean up resources
```

### 🔐 Authentication Tokens (`createAuthTokens`)

Generates mock JWT tokens for testing:

- ✅ User tokens (for regular user operations)
- ✅ Admin tokens (for admin operations)
- ✅ Valid JWT structure with expiration

```typescript
const { userToken, adminToken } = await createAuthTokens();
```

### 🧹 Database Cleanup (`clearDatabase`)

Safely clears all database tables between tests:

- ✅ Truncates all tables
- ✅ Handles foreign key constraints
- ✅ Resets auto-increment counters

```typescript
await clearDatabase(); // Clean slate for each test
```

### 🛠️ Test Helpers (`testHelpers`)

Utility functions for common test operations:

- ✅ `createUserId()` - Generate test user IDs
- ✅ `createCampaignId()` - Generate test campaign IDs
- ✅ `createDashboardCampaignInfoData()` - Generate test data
- ✅ `wait(ms)` - Async delay utility

## Test Configuration

### Environment Variables

The test suite automatically sets up a test environment:

- `NODE_ENV=test`
- `LOG_LEVEL=error` (reduce noise)
- `DATABASE_URL=sqlite::memory:` (in-memory database)
- `CACHE_ENABLED=false` (disable Redis dependency)

### Database Strategy

- **Unit Tests**: Mock repositories and services
- **Integration Tests**: Real database with cleanup between tests
- **Performance**: Uses in-memory SQLite for speed

### Node.js 22 Features

- ✅ **ESM Support**: Full ES modules with top-level await
- ✅ **Native Test Runner**: Vitest with Node.js 22 optimizations
- ✅ **TypeScript Integration**: Native TypeScript support via `tsx`
- ✅ **Performance**: Leverages Node.js 22 performance improvements

## Writing Tests

### Unit Test Example

```typescript
import { describe, it, expect, vi } from 'vitest';
import { YourService } from '@/path/to/service';

describe('YourService', () => {
  it('should perform expected operation', async () => {
    // Arrange
    const mockDependency = vi.fn().mockResolvedValue(expectedResult);
    const service = new YourService(mockDependency);

    // Act
    const result = await service.method(input);

    // Assert
    expect(result.isOk()).toBe(true);
    expect(mockDependency).toHaveBeenCalledWith(input);
  });
});
```

### Integration Test Example

```typescript
import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import {
  createTestApp,
  createAuthTokens,
  clearDatabase,
} from '../setup/test-app';

describe('API Integration Tests', () => {
  let testApp, authTokens;

  beforeAll(async () => {
    testApp = await createTestApp();
    authTokens = await createAuthTokens();
  });

  afterAll(async () => {
    await testApp.cleanup();
  });

  beforeEach(async () => {
    await clearDatabase();
  });

  it('should handle API request', async () => {
    const response = await testApp.app.inject({
      method: 'POST',
      url: '/api/endpoint',
      headers: { 'x-auth-token': authTokens.userToken },
      payload: { data: 'test' },
    });

    expect(response.statusCode).toBe(201);
  });
});
```

## Best Practices

### ✅ Do's

- **Clean State**: Always clean database between tests
- **Isolation**: Each test should be independent
- **Descriptive Names**: Use clear, descriptive test names
- **AAA Pattern**: Arrange, Act, Assert structure
- **Mock External**: Mock external services and dependencies
- **Test Edge Cases**: Include error scenarios and validation

### ❌ Don'ts

- **Shared State**: Don't rely on previous test state
- **Real External APIs**: Don't call real external services
- **Hardcoded Values**: Use helpers for generating test data
- **Long Tests**: Keep tests focused and concise
- **Skip Cleanup**: Always clean up resources

## Test Coverage

Current coverage includes:

- ✅ **Domain Layer**: Entity business logic and validation
- ✅ **Application Layer**: Service orchestration and DTOs
- ✅ **Infrastructure Layer**: Repository operations and mapping
- ✅ **Presentation Layer**: Controller request/response handling
- ✅ **API Layer**: Full HTTP request/response cycles
- ✅ **Authentication**: User and admin authorization flows
- ✅ **Error Handling**: Validation and business rule violations

## Debugging Tests

### Running Single Test

```bash
pnpm test -- --run dashboard-campaign-info.service.test.ts
```

### Debug Mode

```bash
pnpm test -- --inspect-brk
```

### Verbose Output

```bash
pnpm test -- --reporter=verbose
```

### Environment Issues

If tests fail due to environment setup:

1. Check database connection
2. Verify Redis is running (if needed)
3. Check environment variables
4. Review test setup logs

## Performance

### Speed Optimizations

- **In-Memory Database**: SQLite for fast test database
- **Parallel Execution**: Tests run in parallel where possible
- **Efficient Cleanup**: Truncate instead of recreation
- **Minimal Logging**: Error-level only during tests
- **Node.js 22**: Leverages improved V8 performance

### Resource Management

- **Connection Pooling**: Proper database connection handling
- **Memory Management**: Cleanup after each test suite
- **Timeout Handling**: 30-second timeout for integration tests

## pnpm + Node.js 22 Specific

### Package Management

```bash
# Install dependencies
pnpm install

# Add test dependency
pnpm add -D @types/some-test-lib

# Run scripts
pnpm run test:coverage
pnpm run test:ui
```

### TypeScript Configuration

- ✅ **Strict Mode**: Full TypeScript strict mode enabled
- ✅ **Path Mapping**: `@/*` aliases configured in Vitest
- ✅ **ES Modules**: Native ESM support with Node.js 22
- ✅ **Decorators**: Support for dependency injection decorators

### Node.js 22 Features Used

- **Native test runner compatibility**: Vitest optimized for Node.js 22
- **Improved module resolution**: Better ESM handling
- **Performance improvements**: Faster test execution
- **Built-in watch mode**: Enhanced file watching capabilities

## CI/CD Integration

The test suite is designed to work in CI/CD environments with pnpm:

- ✅ No external dependencies required
- ✅ Deterministic test execution
- ✅ Comprehensive coverage reporting
- ✅ Fast execution for quick feedback

### CI Configuration Example

```yaml
# .github/workflows/test.yml
- uses: pnpm/action-setup@v2
  with:
    version: latest
- uses: actions/setup-node@v4
  with:
    node-version: '22'
    cache: 'pnpm'
- run: pnpm install --frozen-lockfile
- run: pnpm run test:coverage
```

### CI Commands

```bash
# Install dependencies
pnpm install --frozen-lockfile

# Run tests with coverage
pnpm run test:coverage -- --reporter=json --outputFile=coverage.json

# Type check
pnpm run type-check

# Lint
pnpm run lint
```

## Troubleshooting

### Common Issues with pnpm + Node.js 22

1. **Module Resolution**: Use `pnpm install` instead of `npm install`
2. **Path Aliases**: Ensure `@/*` paths work in both runtime and tests
3. **ESM Imports**: Use proper ESM syntax with `.js` extensions if needed
4. **TypeScript**: Verify `tsx` is used for TypeScript execution

### Performance Tips

- **pnpm**: Faster installs with hard links and content-addressable storage
- **Node.js 22**: Improved startup time and module loading
- **Vitest**: Faster than Jest with better TypeScript integration
