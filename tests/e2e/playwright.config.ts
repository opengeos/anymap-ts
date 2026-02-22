import { defineConfig } from '@playwright/test';
import path from 'path';

// Resolve project root (two levels up from tests/e2e/)
const projectRoot = path.resolve(__dirname, '..', '..');

export default defineConfig({
  testDir: '.',
  testMatch: '*.test.ts',
  timeout: 120000,
  retries: 1,
  workers: 1, // Run tests serially for JupyterLab stability
  use: {
    baseURL: 'http://localhost:8888',
    video: 'retain-on-failure',
    screenshot: 'only-on-failure',
  },
  webServer: {
    command: [
      'uv run jupyter lab',
      '--port=8888',
      '--no-browser',
      '--ServerApp.token=""',
      '--ServerApp.disable_check_xsrf=true',
      `--notebook-dir=${projectRoot}`,
    ].join(' '),
    port: 8888,
    timeout: 60000,
    reuseExistingServer: !process.env.CI,
  },
  expect: {
    toMatchSnapshot: {
      // Allow 5% pixel difference for map tile rendering variations
      maxDiffPixelRatio: 0.05,
    },
  },
});
