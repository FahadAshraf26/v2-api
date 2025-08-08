import 'reflect-metadata';

// Load test environment variables
process.env['NODE_ENV'] = 'test';
process.env['LOG_LEVEL'] = 'error'; // Reduce log noise in tests

// Node.js 22 specific optimizations
process.env['NODE_OPTIONS'] = '--max-old-space-size=4096 --enable-source-maps';

// Set test database configuration if needed
if (!process.env['DATABASE_URL']) {
  process.env['DATABASE_URL'] = 'sqlite:///:memory:'; // Use in-memory SQLite for tests (Node.js 22 compatible format)
}

// Set test Redis configuration
if (!process.env['REDIS_HOST']) {
  process.env['REDIS_HOST'] = 'localhost';
}
if (!process.env['REDIS_PORT']) {
  process.env['REDIS_PORT'] = '6379';
}

// Disable cache for tests if Redis is not available
process.env['CACHE_ENABLED'] = 'false';

// JWT secret for tests
process.env['JWT_SECRET'] = 'test-jwt-secret-key-for-node22-typescript-pnpm';

// Other test-specific configurations
process.env['API_RATE_LIMIT'] = '1000'; // High rate limit for tests
process.env['CORS_ORIGIN'] = '*'; // Allow all origins in tests

// pnpm and Node.js 22 optimizations
process.env['PNPM_DEDUPE_PEER_DEPENDENTS'] = 'false'; // Speed up pnpm operations
process.env['FORCE_COLOR'] = '1'; // Enable colors in CI

// Database connection settings for tests
process.env['DB_POOL_MIN'] = '0';
process.env['DB_POOL_MAX'] = '5';
process.env['DB_IDLE_TIMEOUT'] = '10000';

// Fastify test configuration
process.env['PORT'] = '0'; // Use random port for tests
process.env['HOST'] = '127.0.0.1';

console.log(
  '🧪 Test environment configured for Node.js 22 + pnpm + TypeScript'
);
console.log(`📦 Node.js version: ${process.version}`);
console.log(`🎯 Target: Node.js 22 with ESM + TypeScript`);
console.log(`⚡ pnpm optimizations enabled`);
