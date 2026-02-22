/**
 * E2E test: Multiple widget types render in JupyterLab.
 *
 * Uses Galata (Playwright) to verify that different map widget types
 * can be instantiated within a single notebook without errors.
 */

import { test, expect } from '@jupyterlab/galata';
import path from 'path';

// Use a pre-built notebook instead of programmatic cell creation
// to avoid issues with setCell/addCell timing
const MAPLIBRE_NB = 'maplibre_basic.ipynb';
const LEAFLET_NB = 'leaflet_basic.ipynb';

test.use({ tmpPath: 'test-multi-widget' });

test.describe('Multi-Widget E2E', () => {
  const errors: string[] = [];

  test.beforeEach(async ({ page, tmpPath }) => {
    errors.length = 0;

    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        errors.push(msg.text());
      }
    });

    // Upload both notebooks
    const maplibrePath = path.resolve(__dirname, 'notebooks', MAPLIBRE_NB);
    const leafletPath = path.resolve(__dirname, 'notebooks', LEAFLET_NB);
    await page.contents.uploadFile(maplibrePath, `${tmpPath}/${MAPLIBRE_NB}`);
    await page.contents.uploadFile(leafletPath, `${tmpPath}/${LEAFLET_NB}`);
  });

  test.afterEach(async ({ page, tmpPath }) => {
    for (const nb of [MAPLIBRE_NB, LEAFLET_NB]) {
      if (await page.contents.fileExists(`${tmpPath}/${nb}`)) {
        await page.contents.deleteFile(`${tmpPath}/${nb}`);
      }
    }
  });

  test('should execute MapLibre and Leaflet notebooks without errors', async ({
    page,
    tmpPath,
  }) => {
    // Run MapLibre notebook
    await page.notebook.openByPath(`${tmpPath}/${MAPLIBRE_NB}`);
    await page.notebook.activate(MAPLIBRE_NB);
    await page.notebook.runCellByCell();

    // Verify MapLibre cell produced output
    let cellOutput = page.locator('.jp-OutputArea-child');
    await expect(cellOutput.first()).toBeVisible({ timeout: 30000 });

    // Check for Python errors
    let errorOutput = page.locator(
      '.jp-OutputArea-output .jp-RenderedText[data-mime-type="application/vnd.jupyter.stderr"]'
    );
    let errorCount = await errorOutput.count();
    expect(errorCount, 'MapLibre cell should not produce Python errors').toBe(
      0
    );

    // Close the notebook
    await page.notebook.close(true);

    // Run Leaflet notebook
    await page.notebook.openByPath(`${tmpPath}/${LEAFLET_NB}`);
    await page.notebook.activate(LEAFLET_NB);
    await page.notebook.runCellByCell();

    // Verify Leaflet cell produced output
    cellOutput = page.locator('.jp-OutputArea-child');
    await expect(cellOutput.first()).toBeVisible({ timeout: 30000 });

    // Check for Python errors
    errorOutput = page.locator(
      '.jp-OutputArea-output .jp-RenderedText[data-mime-type="application/vnd.jupyter.stderr"]'
    );
    errorCount = await errorOutput.count();
    expect(errorCount, 'Leaflet cell should not produce Python errors').toBe(0);
  });
});
