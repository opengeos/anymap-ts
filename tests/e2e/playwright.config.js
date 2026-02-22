/**
 * Playwright configuration for anymap-ts E2E tests.
 *
 * Uses plain Playwright (no Galata) for maximum compatibility.
 * Starts JupyterLab via npm start and tests widget rendering.
 */
const { defineConfig } = require('@playwright/test');

module.exports = defineConfig({
  testDir: '.',
  testMatch: '*.test.ts',
  timeout: 120000,
  retries: 1,
  workers: 1,
  use: {
    baseURL: 'http://localhost:8888',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    trace: 'on-first-retry',
  },
  webServer: {
    command: 'npm start',
    url: 'http://localhost:8888/lab',
    timeout: 120 * 1000,
    reuseExistingServer: !process.env.CI,
  },
  expect: {
    toMatchSnapshot: {
      maxDiffPixelRatio: 0.05,
    },
  },
});
