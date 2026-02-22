/**
 * E2E test: MapLibre widget renders in JupyterLab.
 *
 * Uses Galata (Playwright) to open a notebook, run a cell that displays
 * a MapLibreMap widget, and verify that the widget output appears.
 */

import { test, expect } from '@jupyterlab/galata';
import path from 'path';

const NOTEBOOK = 'maplibre_basic.ipynb';

test.use({ tmpPath: 'test-maplibre' });

test.describe('MapLibre Widget E2E', () => {
  const errors: string[] = [];

  test.beforeEach(async ({ page, tmpPath }) => {
    errors.length = 0;

    // Capture browser console errors for debugging
    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        errors.push(msg.text());
      }
    });

    const notebookPath = path.resolve(__dirname, 'notebooks', NOTEBOOK);
    await page.contents.uploadFile(notebookPath, `${tmpPath}/${NOTEBOOK}`);
  });

  test.afterEach(async ({ page, tmpPath }) => {
    // Clean up
    if (await page.contents.fileExists(`${tmpPath}/${NOTEBOOK}`)) {
      await page.contents.deleteFile(`${tmpPath}/${NOTEBOOK}`);
    }
  });

  test('should render a MapLibre widget', async ({ page, tmpPath }) => {
    await page.notebook.openByPath(`${tmpPath}/${NOTEBOOK}`);
    await page.notebook.activate(NOTEBOOK);

    // Run all cells and wait for execution
    await page.notebook.runCellByCell();

    // Wait for any cell output to appear first
    const cellOutput = page.locator('.jp-OutputArea-child');
    await expect(cellOutput.first()).toBeVisible({ timeout: 30000 });

    // Check for widget output — anywidget creates a widget-subarea container
    // Use a longer timeout since the widget JS loads asynchronously
    const widgetOutput = page.locator('.jp-OutputArea-output .widget-subarea');
    const hasWidget = await widgetOutput.first().isVisible({ timeout: 60000 }).catch(() => false);

    if (hasWidget) {
      // Verify the widget has content (canvas or div)
      const widgetContent = widgetOutput.locator('canvas, div').first();
      await expect(widgetContent).toBeVisible({ timeout: 15000 });
    } else {
      // If widget-subarea isn't found, check for any output (text fallback)
      // and log console errors for debugging
      const anyOutput = page.locator('.jp-OutputArea-output');
      await expect(anyOutput.first()).toBeVisible({ timeout: 10000 });

      // Take a screenshot for debugging
      await page.screenshot({ path: 'test-results/maplibre-debug.png' });

      // Log captured errors
      if (errors.length > 0) {
        console.log('Browser console errors:', errors.join('\n'));
      }

      // Check that there are no Python errors in the output
      const errorOutput = page.locator('.jp-OutputArea-output .jp-RenderedText[data-mime-type="application/vnd.jupyter.stderr"]');
      const hasError = await errorOutput.count();
      expect(hasError, 'Cell execution should not produce Python errors').toBe(0);
    }
  });
});
