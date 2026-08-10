import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./src/__tests__/setup.tsx'],
    include: ['src/**/*.test.{ts,tsx}'],
    exclude: ['node_modules', '.next'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json-summary'],
      include: ['src/lib/**/*.ts', 'src/app/api/**/*.ts', 'src/components/**/*.tsx'],
    },
    deps: {
      optimizer: {
        ssr: {
          include: ['next/link', 'next/navigation'],
        },
      },
    },
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src'),
      '@gamingclips/shared': path.resolve(__dirname, '../../packages/shared/src'),
    },
  },
});
