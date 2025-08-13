import path from 'path';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',

    globals: true,

    testTimeout: 30000,
    hookTimeout: 60000,

    setupFiles: ['./tests/setup/global-setup.ts'],

    include: [
      'tests/unit/domain/**/*.test.ts',
      'tests/unit/application/services/**/*.test.ts',
      'tests/unit/infrastructure/mappers/**/*.test.ts',
      'tests/unit/infrastructure/repositories/**/*.test.ts',
    ],

    exclude: [
      'node_modules',
      'dist',
      'build',
      'coverage',
      'tests/integration/**',
      'tests/e2e/**',
      'src/**/*.test.ts',
      'src/**/*.spec.ts',
    ],

    reporters: ['verbose'],

    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html', 'lcov'],
      reportsDirectory: './coverage',

      include: [
        'src/domain/**/*.ts',
        'src/application/services/**/*.ts',
        'src/infrastructure/mappers/**/*.ts',
        'src/infrastructure/repositories/**/*.ts',
      ],

      exclude: [
        'src/tests/**',
        'src/**/*.test.ts',
        'src/**/*.spec.ts',
        'src/**/*.d.ts',
        'src/server.ts',
        'src/infrastructure/database/**',
        'src/infrastructure/cache/**',
        'src/infrastructure/logging/**',
        'src/infrastructure/middleware/**',
        'src/infrastructure/events/**',
        'src/infrastructure/persistence/**',
        'src/presentation/**',
        'src/config/**',
        'src/shared/errors/**',
        'src/shared/enums/**',
        'src/types/**',
      ],

      thresholds: {
        statements: 85,
        branches: 80,
        functions: 85,
        lines: 85,
      },
    },

    pool: 'forks',
    poolOptions: {
      forks: {
        singleFork: false,
      },
    },

    watch: false,
  },

  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@domain': path.resolve(__dirname, './src/domain'),
      '@application': path.resolve(__dirname, './src/application'),
      '@infrastructure': path.resolve(__dirname, './src/infrastructure'),
      '@presentation': path.resolve(__dirname, './src/presentation'),
      '@shared': path.resolve(__dirname, './src/shared'),
      '@config': path.resolve(__dirname, './src/config'),
      '@types': path.resolve(__dirname, './src/types'),
    },
  },

  esbuild: {
    target: 'node22',
    format: 'esm',
    sourcemap: true,
  },

  define: {
    'process.env.NODE_ENV': '"test"',
  },
});
