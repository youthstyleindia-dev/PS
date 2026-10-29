import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    include: ['tests/**/*.test.ts'],
    testTimeout: 15000,
    fileParallelism: false,
    env: {
      ENABLE_CONTRACT_TEST_BYPASS: 'true'
    }
  },
});
