// #region Imports
import { defineConfig } from 'vitest/config';
import angular from '@analogjs/vite-plugin-angular';
// #endregion

// #region Configuration
export default defineConfig({
  plugins: [angular()],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./src/client/test-setup.ts'],
    include: [
      'src/client/**/*.{spec,test}.ts',
      'src/server/**/*.{spec,test}.ts',
      'src/util/**/*.{spec,test}.ts',
    ],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html'],
      reportsDirectory: '.dist/coverage',
    },
  },
});
// #endregion
