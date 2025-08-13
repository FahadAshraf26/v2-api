import 'reflect-metadata';

process.env['NODE_ENV'] = 'test';
process.env['LOG_LEVEL'] = 'error';

process.env['NODE_OPTIONS'] = '--max-old-space-size=4096 --enable-source-maps';

process.env['PNPM_DEDUPE_PEER_DEPENDENTS'] = 'false';
process.env['FORCE_COLOR'] = '1';

process.env['CACHE_ENABLED'] = 'false';
process.env['DB_ENABLED'] = 'false';

process.env['MOCK_EXTERNAL_SERVICES'] = 'true';

process.env['JWT_SECRET'] = 'test-jwt-secret-key-for-unit-tests';

process.env['API_RATE_LIMIT'] = '1000';
process.env['CORS_ORIGIN'] = '*';
process.env['PORT'] = '0';
process.env['HOST'] = '127.0.0.1';

console.log(
  '🧪 Unit test environment configured for Node.js 22 + pnpm + TypeScript'
);
console.log(`📦 Node.js version: ${process.version}`);
console.log(`🎯 Focus: Domain layer and core business logic testing`);
console.log(`⚡ External dependencies: DISABLED (unit tests only)`);
console.log(`🔧 Coverage target: Domain, Services, Mappers, Repositories`);
