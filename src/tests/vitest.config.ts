import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
  test: {
    // Test environment optimized for Node.js 22
    environment: 'node',

    // Global setup and teardown
    globals: true,

    // Timeout for tests (increased for integration tests)
    testTimeout: 30000,
    hookTimeout: 30000,

    // Setup files to run before tests
    setupFiles: ['./setup/global-setup.ts'],

    // Test patterns
    include: ['**/*.test.ts', '**/*.spec.ts'],

    // Exclude patterns
    exclude: ['node_modules', 'dist', 'build', 'coverage'],

    // Reporter configuration
    reporters: ['verbose'],

    // Coverage configuration optimized for TypeScript
    coverage: {
      provider: 'v8', // Use V8 coverage (faster with Node.js 22)
      reporter: ['text', 'json', 'html', 'lcov'],
      include: ['src/**/*.ts'],
      exclude: [
        'src/tests/**',
        'src/**/*.test.ts',
        'src/**/*.spec.ts',
        'src/**/*.d.ts',
        'src/server.ts', // Main entry point
      ],
      thresholds: {
        statements: 80,
        branches: 80,
        functions: 80,
        lines: 80,
      },
    },

    // Pool options for Node.js 22
    pool: 'forks',
    poolOptions: {
      forks: {
        singleFork: false, // Use multiple processes for speed
      },
    },

    // Watch options
    watch: false,
  },

  // Path resolution with TypeScript support
  resolve: {
    alias: {
      '@': path.resolve(__dirname, '../'),
    },
  },

  // ESBuild configuration for Node.js 22 + TypeScript
  esbuild: {
    target: 'node22', // Target Node.js 22 specifically
    format: 'esm', // Use ES modules
    sourcemap: true, // Enable source maps for debugging
  },

  // Define for environment variables
  define: {
    'process.env.NODE_ENV': '"test"',
  },
});
