/**
 * Helpers for interacting with JupyterLab via the REST API and browser.
 */
import { Page, expect } from '@playwright/test';

const BASE_URL = 'http://localhost:8888';

/**
 * Upload a notebook file to the Jupyter server via REST API.
 */
export async function uploadNotebook(
  page: Page,
  localPath: string,
  serverPath: string
): Promise<void> {
  const fs = await import('fs');
  const content = JSON.parse(fs.readFileSync(localPath, 'utf-8'));

  const response = await page.request.put(
    `${BASE_URL}/api/contents/${serverPath}`,
    {
      data: {
        type: 'notebook',
        content,
      },
    }
  );
  expect(response.ok(), `Failed to upload ${serverPath}`).toBeTruthy();
}

/**
 * Delete a file from the Jupyter server via REST API.
 */
export async function deleteFile(
  page: Page,
  serverPath: string
): Promise<void> {
  await page.request.delete(`${BASE_URL}/api/contents/${serverPath}`);
}

/**
 * Open a notebook in JupyterLab by navigating to its URL.
 */
export async function openNotebook(
  page: Page,
  serverPath: string
): Promise<void> {
  const encodedPath = encodeURIComponent(serverPath);
  await page.goto(
    `${BASE_URL}/lab/tree/${encodedPath}`
  );

  // Wait for JupyterLab to fully load
  await page.waitForSelector('.jp-Notebook', { timeout: 30000 });
}

/**
 * Run all cells in the currently open notebook using the Run menu.
 */
export async function runAllCells(page: Page): Promise<void> {
  // Wait for kernel to be ready (kernel indicator appears)
  await page.waitForSelector('.jp-Notebook-ExecutionIndicator', {
    timeout: 30000,
  }).catch(() => {});

  // Use the JupyterLab menu bar: Run > Run All Cells
  // This is more reliable than keyboard shortcuts which depend on focus state
  await page.locator('.lm-MenuBar-itemLabel:text-is("Run")').click();
  await page.locator('.lm-Menu-itemLabel:text-is("Run All Cells")').click();

  // Wait for kernel to finish execution (idle status)
  // Try multiple selectors since JupyterLab versions may differ
  await page.waitForFunction(
    () => {
      // Check if any cell has a running indicator (asterisk [*])
      const executionCounts = document.querySelectorAll(
        '.jp-InputArea-prompt'
      );
      for (const el of executionCounts) {
        if (el.textContent?.includes('[*]')) return false;
      }
      // All cells finished if none show [*]
      return document.querySelectorAll('.jp-InputArea-prompt').length > 0;
    },
    { timeout: 60000 }
  ).catch(() => {});

  // Give widget JS time to load asynchronously
  await page.waitForTimeout(5000);
}

/**
 * Check if the notebook cell produced any output (widget or text).
 */
export async function waitForCellOutput(
  page: Page,
  timeout = 30000
): Promise<boolean> {
  try {
    await page.waitForSelector('.jp-OutputArea-child', { timeout });
    return true;
  } catch {
    return false;
  }
}

/**
 * Check if a widget subarea is visible (anywidget/ipywidgets output).
 */
export async function waitForWidgetOutput(
  page: Page,
  timeout = 60000
): Promise<boolean> {
  try {
    await page.waitForSelector('.jp-OutputArea-output .widget-subarea', {
      state: 'visible',
      timeout,
    });
    return true;
  } catch {
    return false;
  }
}

/**
 * Check if any Python errors appeared in cell output.
 */
export async function hasPythonErrors(page: Page): Promise<boolean> {
  const errorOutputs = page.locator(
    '.jp-OutputArea-output .jp-RenderedText[data-mime-type="application/vnd.jupyter.stderr"]'
  );
  const count = await errorOutputs.count();
  return count > 0;
}

/**
 * Get text content of Python error outputs.
 */
export async function getPythonErrors(page: Page): Promise<string[]> {
  const errorOutputs = page.locator(
    '.jp-OutputArea-output .jp-RenderedText[data-mime-type="application/vnd.jupyter.stderr"]'
  );
  const count = await errorOutputs.count();
  const errors: string[] = [];
  for (let i = 0; i < count; i++) {
    const text = await errorOutputs.nth(i).textContent();
    if (text) errors.push(text);
  }
  return errors;
}
