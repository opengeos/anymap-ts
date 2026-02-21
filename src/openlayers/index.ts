/**
 * OpenLayers map widget entry point.
 * Uses CDN imports to keep the ESM module small.
 */

import type { AnyModel } from '@anywidget/types';
import type { OpenLayersRenderer } from './OpenLayersRenderer';

// CSS will be loaded dynamically via CDN
const OL_CSS_URL = 'https://esm.sh/ol@10/ol.css';

// Track if CSS has been loaded
let cssLoaded = false;

/**
 * Dynamically load CSS if not already loaded
 */
function loadCSS(url: string): void {
  const existing = document.querySelector(`link[href="${url}"]`);
  if (existing) return;

  const link = document.createElement('link');
  link.rel = 'stylesheet';
  link.href = url;
  document.head.appendChild(link);
}

/**
 * Load all required CSS files
 */
function loadAllCSS(): void {
  if (cssLoaded) return;
  
  loadCSS(OL_CSS_URL);
  
  cssLoaded = true;
}

/**
 * Store renderer reference on element for cleanup and multi-cell support.
 */
declare global {
  interface HTMLElement {
    _olRenderer?: OpenLayersRenderer;
  }
  interface Window {
    _anymapTsOlLoaded?: boolean;
    _anymapTsOlLoading?: Promise<typeof import('ol')>;
  }
}

/**
 * Dynamically import ol from CDN with caching
 */
async function loadOl(): Promise<typeof import('ol')> {
  if (window._anymapTsOlLoaded && window._anymapTsOlLoading) {
    return window._anymapTsOlLoading;
  }

  if (window._anymapTsOlLoading) {
    return window._anymapTsOlLoading;
  }

  window._anymapTsOlLoading = import('https://esm.sh/ol@10');
  
  try {
    const ol = await window._anymapTsOlLoading;
    window._anymapTsOlLoaded = true;
    return ol;
  } catch (error) {
    window._anymapTsOlLoading = undefined;
    throw error;
  }
}

/**
 * anywidget render function.
 * Uses dynamic imports to load OpenLayers from CDN.
 */
async function render({ model, el }: { model: AnyModel; el: HTMLElement }): Promise<() => void> {
  // Clean up previous instance if exists
  if (el._olRenderer) {
    el._olRenderer.destroy();
    delete el._olRenderer;
  }

  // Load CSS
  loadAllCSS();

  try {
    // Load OpenLayers from CDN
    const olModule = await loadOl();

    // Dynamically import the renderer class
    const { OpenLayersRenderer: RendererClass } = await import('./OpenLayersRenderer');

    // Create renderer with loaded ol module
    const renderer = new RendererClass(model as any, el, olModule);
    el._olRenderer = renderer;

    // Initialize asynchronously
    renderer.initialize().catch((error: Error) => {
      console.error('Failed to initialize OpenLayers map:', error);
    });

    // Return cleanup function
    return () => {
      if (el._olRenderer) {
        el._olRenderer.destroy();
        delete el._olRenderer;
      }
    };
  } catch (error) {
    console.error('Failed to load OpenLayers from CDN:', error);
    el.innerHTML = '<div style="padding: 20px; color: red;">Failed to load map library. Please check your internet connection.</div>';
    return () => {};
  }
}

export default { render };
