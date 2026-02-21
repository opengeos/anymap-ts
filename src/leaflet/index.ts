/**
 * Leaflet module entry point for anywidget.
 * Uses CDN imports to keep the ESM module small.
 */

import type { AnyModel } from '@anywidget/types';
import type { LeafletRenderer } from './LeafletRenderer';

// CSS will be loaded dynamically via CDN
const LEAFLET_CSS_URL = 'https://esm.sh/leaflet@1/dist/leaflet.css';

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
  
  loadCSS(LEAFLET_CSS_URL);
  
  cssLoaded = true;
}

/**
 * Store renderer reference on element for cleanup and multi-cell support.
 */
declare global {
  interface HTMLElement {
    _leafletRenderer?: LeafletRenderer;
  }
  interface Window {
    _anymapTsLeafletLoaded?: boolean;
    _anymapTsLeafletLoading?: Promise<typeof import('leaflet')>;
  }
}

/**
 * Dynamically import leaflet from CDN with caching
 */
async function loadLeaflet(): Promise<typeof import('leaflet')> {
  if (window._anymapTsLeafletLoaded && window._anymapTsLeafletLoading) {
    return window._anymapTsLeafletLoading;
  }

  if (window._anymapTsLeafletLoading) {
    return window._anymapTsLeafletLoading;
  }

  window._anymapTsLeafletLoading = import('https://esm.sh/leaflet@1');
  
  try {
    const leaflet = await window._anymapTsLeafletLoading;
    window._anymapTsLeafletLoaded = true;
    return leaflet;
  } catch (error) {
    window._anymapTsLeafletLoading = undefined;
    throw error;
  }
}

/**
 * anywidget render function.
 * Uses dynamic imports to load Leaflet from CDN.
 */
async function render({ model, el }: { model: AnyModel; el: HTMLElement }): Promise<() => void> {
  // Clean up previous instance if exists
  if (el._leafletRenderer) {
    el._leafletRenderer.destroy();
    delete el._leafletRenderer;
  }

  // Load CSS
  loadAllCSS();

  try {
    // Load Leaflet from CDN
    const leafletModule = await loadLeaflet();

    // Dynamically import the renderer class
    const { LeafletRenderer: RendererClass } = await import('./LeafletRenderer');

    // Create renderer with loaded leaflet module
    const renderer = new RendererClass(model as any, el, leafletModule);
    el._leafletRenderer = renderer;

    // Initialize asynchronously
    renderer.initialize().catch((error: Error) => {
      console.error('Failed to initialize Leaflet map:', error);
    });

    // Return cleanup function
    return () => {
      if (el._leafletRenderer) {
        el._leafletRenderer.destroy();
        delete el._leafletRenderer;
      }
    };
  } catch (error) {
    console.error('Failed to load Leaflet from CDN:', error);
    el.innerHTML = '<div style="padding: 20px; color: red;">Failed to load map library. Please check your internet connection.</div>';
    return () => {};
  }
}

export default { render };
