import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    clearMocks: true,
    coverage: {
      provider: 'v8',
      reporter: ['json', 'lcov', 'text', 'clover'],
      exclude: ['/node_modules/'],
    },
    environment: 'node',
    include: ['**/__tests__/**/*.test.ts'],
    globals: true,
    testTimeout: 10000,
    poolOptions: {
      threads: {
        maxThreads: 10,
      },
    },
  },
}); 