/**
 * E2E test: Leaflet widget renders in JupyterLab.
 *
 * Uses Galata (Playwright) to open a notebook, run a cell that displays
 * a LeafletMap widget, and verify that the Leaflet container appears.
 */

import { test, expect } from '@jupyterlab/galata';
import path from 'path';

const NOTEBOOK = 'leaflet_basic.ipynb';

test.describe('Leaflet Widget E2E', () => {
  test.beforeEach(async ({ page, tmpPath }) => {
    const notebookPath = path.resolve(__dirname, 'notebooks', NOTEBOOK);
    await page.contents.uploadFile(notebookPath, `${tmpPath}/${NOTEBOOK}`);
  });

  test('should render a Leaflet map container', async ({
    page,
    tmpPath,
  }) => {
    await page.notebook.openByPath(`${tmpPath}/${NOTEBOOK}`);
    await page.notebook.activate(NOTEBOOK);
    await page.notebook.runCellByCell();

    const widgetOutput = page.locator(
      '.jp-OutputArea-output .widget-subarea'
    );
    await expect(widgetOutput.first()).toBeVisible({ timeout: 30000 });

    // Leaflet renders into a div with class 'leaflet-container'
    const leafletContainer = widgetOutput.locator('.leaflet-container').first();
    await expect(leafletContainer).toBeVisible({ timeout: 15000 });

    // Verify non-zero dimensions
    const box = await leafletContainer.boundingBox();
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

    expect(await widgetOutput.first().screenshot()).toMatchSnapshot(
      'leaflet-basic.png'
    );
  });
});
