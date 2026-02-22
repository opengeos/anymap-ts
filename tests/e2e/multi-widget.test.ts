/**
 * E2E test: Multiple widget types in a single notebook.
 *
 * Verifies that MapLibre and Leaflet widgets can be instantiated
 * in the same notebook without errors.
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

const NOTEBOOK = 'multi_widget.ipynb';
const SERVER_PATH = 'test_multi_widget.ipynb';

test.describe('Multi-Widget E2E', () => {
  test.beforeEach(async ({ page }) => {
    const notebookPath = path.resolve(__dirname, 'notebooks', NOTEBOOK);
    await uploadNotebook(page, notebookPath, SERVER_PATH);
  });

  test.afterEach(async ({ page }) => {
    await deleteFile(page, SERVER_PATH).catch(() => {});
  });

  test('should execute both MapLibre and Leaflet in one notebook', async ({
    page,
  }) => {
    await openNotebook(page, SERVER_PATH);
    await runAllCells(page);

    const hasOutput = await waitForCellOutput(page);
    expect(hasOutput, 'Cells should produce output').toBeTruthy();

    const hasErrors = await hasPythonErrors(page);
    if (hasErrors) {
      const errors = await getPythonErrors(page);
      console.log('Python errors:', errors);
    }
    expect(hasErrors, 'No Python errors should occur').toBeFalsy();
  });
});
