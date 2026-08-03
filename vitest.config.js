import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'jsdom',

    environmentOptions: {
      jsdom: {
        url: 'http://localhost/'
      }
    },

    globals: true,

    setupFiles: [
      './tests/setup.js'
    ],

    include: [
      'tests/unit/**/*.{test,spec}.js',
      'tests/business/**/*.{test,spec}.js'
    ],

    exclude: [
      'tests/e2e/**',
      'node_modules/**',
      'dist/**',
      'coverage/**',
      'playwright-report/**',
      'test-results/**'
    ],

    clearMocks: true,
    mockReset: true,
    restoreMocks: true,

    coverage: {
      provider: 'v8',

      reportsDirectory: 'coverage',

      reporter: [
        'text',
        'html',
        'lcov'
      ],

      include: [
        'src/**/*.js'
      ],

      exclude: [
        'src/main.js',
        'src/data/seeds/**',
        'src/data/migrations/**'
      ]
    }
  }
});