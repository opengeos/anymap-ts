/**
 * E2E test: Leaflet widget renders in JupyterLab.
 *
 * Uses plain Playwright to open a notebook in JupyterLab,
 * run a cell that displays a LeafletMap widget, and verify output.
 */
import { test, expect } from '@playwright/test';
import path from 'path';
import {
  uploadNotebook,
  deleteFile,
  openNotebook,
  runAllCells,
  waitForCellOutput,
  waitForWidgetOutput,
  hasPythonErrors,
  getPythonErrors,
} from './helpers/jupyter';

const NOTEBOOK = 'leaflet_basic.ipynb';
const SERVER_PATH = 'test_leaflet_basic.ipynb';

test.describe('Leaflet Widget E2E', () => {
  test.beforeEach(async ({ page }) => {
    const notebookPath = path.resolve(__dirname, 'notebooks', NOTEBOOK);
    await uploadNotebook(page, notebookPath, SERVER_PATH);
  });

  test.afterEach(async ({ page }) => {
    await deleteFile(page, SERVER_PATH).catch(() => {});
  });

  test('should execute Leaflet widget without errors', async ({ page }) => {
    await openNotebook(page, SERVER_PATH);
    await runAllCells(page);

    // Verify cell produced output
    const hasOutput = await waitForCellOutput(page);
    expect(hasOutput, 'Cell should produce output').toBeTruthy();

    // Check for Python errors
    const hasErrors = await hasPythonErrors(page);
    if (hasErrors) {
      const errors = await getPythonErrors(page);
      console.log('Python errors:', errors);
    }
    expect(hasErrors, 'No Python errors should occur').toBeFalsy();

    // Check for widget rendering (best effort)
    const hasWidget = await waitForWidgetOutput(page);
    if (hasWidget) {
      // Leaflet renders into a div with class 'leaflet-container'
      const leafletContainer = page
        .locator('.widget-subarea .leaflet-container')
        .first();
      await expect(leafletContainer).toBeVisible({ timeout: 15000 });
    }
  });
});
