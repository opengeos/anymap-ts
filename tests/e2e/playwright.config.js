/**
 * Configuration for Playwright using default from @jupyterlab/galata
 */
const baseConfig = require('@jupyterlab/galata/lib/playwright-config');

module.exports = {
  ...baseConfig,
  testDir: '.',
  testMatch: '*.test.ts',
  timeout: 120000,
  retries: 1,
  workers: 1,
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
};
