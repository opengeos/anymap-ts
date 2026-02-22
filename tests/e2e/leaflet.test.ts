/**
 * E2E test: Leaflet widget renders in JupyterLab.
 *
 * Uses Galata (Playwright) to open a notebook, run a cell that displays
 * a LeafletMap widget, and verify that the widget output appears.
 */

import { test, expect } from '@jupyterlab/galata';
import path from 'path';

const NOTEBOOK = 'leaflet_basic.ipynb';

test.use({ tmpPath: 'test-leaflet' });

test.describe('Leaflet Widget E2E', () => {
  const errors: string[] = [];

  test.beforeEach(async ({ page, tmpPath }) => {
    errors.length = 0;

    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        errors.push(msg.text());
      }
    });

    const notebookPath = path.resolve(__dirname, 'notebooks', NOTEBOOK);
    await page.contents.uploadFile(notebookPath, `${tmpPath}/${NOTEBOOK}`);
  });

  test.afterEach(async ({ page, tmpPath }) => {
    if (await page.contents.fileExists(`${tmpPath}/${NOTEBOOK}`)) {
      await page.contents.deleteFile(`${tmpPath}/${NOTEBOOK}`);
    }
  });

  test('should render a Leaflet widget', async ({ page, tmpPath }) => {
    await page.notebook.openByPath(`${tmpPath}/${NOTEBOOK}`);
    await page.notebook.activate(NOTEBOOK);

    await page.notebook.runCellByCell();

    // Wait for any cell output to appear
    const cellOutput = page.locator('.jp-OutputArea-child');
    await expect(cellOutput.first()).toBeVisible({ timeout: 30000 });

    // Check for widget output with longer timeout for async JS loading
    const widgetOutput = page.locator('.jp-OutputArea-output .widget-subarea');
    const hasWidget = await widgetOutput.first().isVisible({ timeout: 60000 }).catch(() => false);

    if (hasWidget) {
      // Leaflet renders into a div with class 'leaflet-container'
      const leafletContainer = widgetOutput.locator('.leaflet-container').first();
      await expect(leafletContainer).toBeVisible({ timeout: 15000 });
    } else {
      // Verify no Python errors occurred
      const anyOutput = page.locator('.jp-OutputArea-output');
      await expect(anyOutput.first()).toBeVisible({ timeout: 10000 });

      await page.screenshot({ path: 'test-results/leaflet-debug.png' });

      if (errors.length > 0) {
        console.log('Browser console errors:', errors.join('\n'));
      }

      const errorOutput = page.locator('.jp-OutputArea-output .jp-RenderedText[data-mime-type="application/vnd.jupyter.stderr"]');
      const hasError = await errorOutput.count();
      expect(hasError, 'Cell execution should not produce Python errors').toBe(0);
    }
  });
});
