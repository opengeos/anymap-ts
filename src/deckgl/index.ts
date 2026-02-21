/**
 * DeckGL map widget entry point.
 * Extends MapLibre with deck.gl visualization layers.
 * Uses CDN imports to keep the ESM module small.
 */

import type { AnyModel } from '@anywidget/types';
import type { DeckGLRenderer } from './DeckGLRenderer';

// CSS will be loaded dynamically via CDN
const MAPLIBRE_CSS_URL = 'https://esm.sh/maplibre-gl@5/dist/maplibre-gl.css';
const LAYER_CONTROL_CSS_URL = 'https://esm.sh/maplibre-gl-layer-control@0.14.0/style.css';

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
  
  loadCSS(MAPLIBRE_CSS_URL);
  loadCSS(LAYER_CONTROL_CSS_URL);
  
  cssLoaded = true;
}

/**
 * Store renderer reference on element for cleanup and multi-cell support.
 */
declare global {
  interface HTMLElement {
    _deckRenderer?: DeckGLRenderer;
  }
  interface Window {
    _anymapTsDeckLoaded?: boolean;
    _anymapTsDeckLoading?: Promise<typeof import('maplibre-gl')>;
  }
}

/**
 * Dynamically import maplibre-gl from CDN with caching
 */
async function loadMapLibre(): Promise<typeof import('maplibre-gl')> {
  if (window._anymapTsDeckLoaded && window._anymapTsDeckLoading) {
    return window._anymapTsDeckLoading;
  }

  if (window._anymapTsDeckLoading) {
    return window._anymapTsDeckLoading;
  }

  window._anymapTsDeckLoading = import('https://esm.sh/maplibre-gl@5');
  
  try {
    const maplibre = await window._anymapTsDeckLoading;
    window._anymapTsDeckLoaded = true;
    return maplibre;
  } catch (error) {
    window._anymapTsDeckLoading = undefined;
    throw error;
  }
}

/**
 * anywidget render function.
 * Uses dynamic imports to load MapLibre from CDN.
 */
async function render({ model, el }: { model: AnyModel; el: HTMLElement }): Promise<() => void> {
  // Clean up previous instance if exists
  if (el._deckRenderer) {
    el._deckRenderer.destroy();
    delete el._deckRenderer;
  }

  // Load CSS
  loadAllCSS();

  try {
    // Load MapLibre GL JS from CDN
    const maplibreModule = await loadMapLibre();

    // Dynamically import the renderer class
    const { DeckGLRenderer: RendererClass } = await import('./DeckGLRenderer');

    // Create renderer with loaded maplibre module
    const renderer = new RendererClass(model as any, el, maplibreModule);
    el._deckRenderer = renderer;

    // Initialize asynchronously
    renderer.initialize().catch((error: Error) => {
      console.error('Failed to initialize DeckGL map:', error);
    });

    // Return cleanup function
    return () => {
      if (el._deckRenderer) {
        el._deckRenderer.destroy();
        delete el._deckRenderer;
      }
    };
  } catch (error) {
    console.error('Failed to load DeckGL from CDN:', error);
    el.innerHTML = '<div style="padding: 20px; color: red;">Failed to load map library. Please check your internet connection.</div>';
    return () => {};
  }
}

export default { render };
