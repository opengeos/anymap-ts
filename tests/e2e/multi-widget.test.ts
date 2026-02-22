/**
 * E2E test: Multiple widget types render in JupyterLab.
 *
 * Uses Galata (Playwright) to verify that different map widget types
 * can be instantiated and rendered within a single notebook.
 */

import { test, expect } from '@jupyterlab/galata';

test.describe('Multi-Widget E2E', () => {
  test('should render MapLibre and Leaflet widgets in the same notebook', async ({
    page,
    tmpPath,
  }) => {
    // Create a notebook programmatically
    await page.notebook.createNew();

    // Add and run a MapLibre cell
    await page.notebook.setCell(
      0,
      'code',
      'from anymap_ts import Map\nm = Map(height="300px", controls={})\nm'
    );
    await page.notebook.runCell(0);

    // Add and run a Leaflet cell
    await page.notebook.addCell(
      'code',
      'from anymap_ts import LeafletMap\nlm = LeafletMap(height="300px", controls={})\nlm'
    );
    await page.notebook.runCell(1);

    // Wait for widgets to appear
    const outputs = page.locator('.jp-OutputArea-output .widget-subarea');
    await expect(outputs.first()).toBeVisible({ timeout: 30000 });

    // Both cells should produce widget output
    const outputCount = await outputs.count();
    expect(outputCount).toBeGreaterThanOrEqual(2);
  });
});
