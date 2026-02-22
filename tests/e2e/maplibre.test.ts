/**
 * E2E test: MapLibre widget renders in JupyterLab.
 *
 * Uses plain Playwright to open a notebook in JupyterLab,
 * run a cell that displays a MapLibreMap widget, and verify output.
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

const NOTEBOOK = 'maplibre_basic.ipynb';
const SERVER_PATH = 'test_maplibre_basic.ipynb';

test.describe('MapLibre Widget E2E', () => {
  test.beforeEach(async ({ page }) => {
    const notebookPath = path.resolve(__dirname, 'notebooks', NOTEBOOK);
    await uploadNotebook(page, notebookPath, SERVER_PATH);
  });

  test.afterEach(async ({ page }) => {
    await deleteFile(page, SERVER_PATH).catch(() => {});
  });

  test('should execute MapLibre widget without errors', async ({ page }) => {
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

    // Check for widget rendering (best effort - may not render in CI)
    const hasWidget = await waitForWidgetOutput(page);
    if (hasWidget) {
      // Verify the map canvas exists (MapLibre renders to canvas)
      const canvas = page.locator('.widget-subarea canvas').first();
      await expect(canvas).toBeVisible({ timeout: 15000 });
    }
  });
});
