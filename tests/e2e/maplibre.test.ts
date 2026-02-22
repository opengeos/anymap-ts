/**
 * E2E test: MapLibre widget renders in JupyterLab.
 *
 * Uses Galata (Playwright) to open a notebook, run a cell that displays
 * a MapLibreMap widget, and verify that the map canvas appears.
 */

import { test, expect } from '@jupyterlab/galata';
import path from 'path';

const NOTEBOOK = 'maplibre_basic.ipynb';

test.describe('MapLibre Widget E2E', () => {
  test.beforeEach(async ({ page, tmpPath }) => {
    // Upload the test notebook
    const notebookPath = path.resolve(__dirname, 'notebooks', NOTEBOOK);
    await page.contents.uploadFile(notebookPath, `${tmpPath}/${NOTEBOOK}`);
  });

  test('should render a MapLibre map with canvas', async ({
    page,
    tmpPath,
  }) => {
    // Open the notebook
    await page.notebook.openByPath(`${tmpPath}/${NOTEBOOK}`);
    await page.notebook.activate(NOTEBOOK);

    // Run all cells
    await page.notebook.runCellByCell();

    // Wait for the widget output to appear
    const widgetOutput = page.locator(
      '.jp-OutputArea-output .widget-subarea'
    );
    await expect(widgetOutput.first()).toBeVisible({ timeout: 30000 });

    // Verify that a map container div with a canvas exists
    // MapLibre renders into a canvas element
    const mapCanvas = widgetOutput.locator('canvas').first();
    await expect(mapCanvas).toBeVisible({ timeout: 15000 });

    // Verify the container has non-zero dimensions
    const box = await mapCanvas.boundingBox();
    expect(box).not.toBeNull();
    expect(box!.width).toBeGreaterThan(0);
    expect(box!.height).toBeGreaterThan(0);
  });

  test('should match visual snapshot', async ({ page, tmpPath }) => {
    await page.notebook.openByPath(`${tmpPath}/${NOTEBOOK}`);
    await page.notebook.activate(NOTEBOOK);
    await page.notebook.runCellByCell();

    const widgetOutput = page.locator(
      '.jp-OutputArea-output .widget-subarea'
    );
    await expect(widgetOutput.first()).toBeVisible({ timeout: 30000 });

    // Wait for tiles to load
    await page.waitForTimeout(5000);

    // Take screenshot for visual regression
    expect(await widgetOutput.first().screenshot()).toMatchSnapshot(
      'maplibre-basic.png'
    );
  });
});
