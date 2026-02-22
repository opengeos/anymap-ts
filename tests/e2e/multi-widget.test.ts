/**
 * E2E test: Multiple widget types render in JupyterLab.
 *
 * Uses plain Playwright to verify that different map widget types
 * can be instantiated within JupyterLab without errors.
 */
import { test, expect } from '@playwright/test';
import path from 'path';
import {
  uploadNotebook,
  deleteFile,
  openNotebook,
  runAllCells,
  waitForCellOutput,
  hasPythonErrors,
  getPythonErrors,
} from './helpers/jupyter';

const MAPLIBRE_NB = 'maplibre_basic.ipynb';
const LEAFLET_NB = 'leaflet_basic.ipynb';
const MAPLIBRE_PATH = 'test_multi_maplibre.ipynb';
const LEAFLET_PATH = 'test_multi_leaflet.ipynb';

test.describe('Multi-Widget E2E', () => {
  test.beforeEach(async ({ page }) => {
    const maplibrePath = path.resolve(__dirname, 'notebooks', MAPLIBRE_NB);
    const leafletPath = path.resolve(__dirname, 'notebooks', LEAFLET_NB);
    await uploadNotebook(page, maplibrePath, MAPLIBRE_PATH);
    await uploadNotebook(page, leafletPath, LEAFLET_PATH);
  });

  test.afterEach(async ({ page }) => {
    await deleteFile(page, MAPLIBRE_PATH).catch(() => {});
    await deleteFile(page, LEAFLET_PATH).catch(() => {});
  });

  test('should execute MapLibre and Leaflet notebooks without errors', async ({
    page,
  }) => {
    // Run MapLibre notebook
    await openNotebook(page, MAPLIBRE_PATH);
    await runAllCells(page);

    let hasOutput = await waitForCellOutput(page);
    expect(hasOutput, 'MapLibre cell should produce output').toBeTruthy();

    let hasErrors = await hasPythonErrors(page);
    if (hasErrors) {
      const errors = await getPythonErrors(page);
      console.log('MapLibre Python errors:', errors);
    }
    expect(hasErrors, 'MapLibre should not produce Python errors').toBeFalsy();

    // Run Leaflet notebook
    await openNotebook(page, LEAFLET_PATH);
    await runAllCells(page);

    hasOutput = await waitForCellOutput(page);
    expect(hasOutput, 'Leaflet cell should produce output').toBeTruthy();

    hasErrors = await hasPythonErrors(page);
    if (hasErrors) {
      const errors = await getPythonErrors(page);
      console.log('Leaflet Python errors:', errors);
    }
    expect(hasErrors, 'Leaflet should not produce Python errors').toBeFalsy();
  });
});
