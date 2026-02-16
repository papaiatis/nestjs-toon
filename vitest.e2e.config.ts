import { defineConfig } from 'vitest/config';
import swc from 'unplugin-swc';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    root: './',
    include: ['test/e2e/**/*.e2e-spec.ts'],
  },
  plugins: [swc.vite()],
});
