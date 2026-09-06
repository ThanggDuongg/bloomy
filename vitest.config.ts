import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: './src/test/setup.ts',
    css: true,
    pool: 'threads',
    // Single worker keeps the suite stable on Node 25 (avoids flaky worker timeouts).
    maxWorkers: 1,
    minWorkers: 1,
  },
});
