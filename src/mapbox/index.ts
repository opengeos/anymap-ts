/**
 * Mapbox module entry point for anywidget.
 * Uses CDN imports to keep the ESM module small.
 */

import type { AnyModel } from '@anywidget/types';
import type { MapboxRenderer } from './MapboxRenderer';

// CSS will be loaded dynamically via CDN
const MAPBOX_CSS_URL = 'https://esm.sh/mapbox-gl@3/dist/mapbox-gl.css';
const LIDAR_CSS_URL = 'https://esm.sh/maplibre-gl-lidar@0.11.1/style.css';
const COMPONENTS_CSS_URL = 'https://esm.sh/maplibre-gl-components@0.15.0/style.css';

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
  
  loadCSS(MAPBOX_CSS_URL);
  loadCSS(LIDAR_CSS_URL);
  loadCSS(COMPONENTS_CSS_URL);
  
  cssLoaded = true;
}

/**
 * Store renderer reference on element for cleanup and multi-cell support.
 */
declare global {
  interface HTMLElement {
    _mapboxRenderer?: MapboxRenderer;
  }
  interface Window {
    _anymapTsMapboxLoaded?: boolean;
    _anymapTsMapboxLoading?: Promise<any>;
  }
}

/**
 * Dynamically import mapbox-gl from CDN with caching
 * Handles both direct module and wrapped default export structures
 */
async function loadMapbox(): Promise<typeof import('mapbox-gl')> {
  if (window._anymapTsMapboxLoaded && window._anymapTsMapboxLoading) {
    return window._anymapTsMapboxLoading;
  }

  if (window._anymapTsMapboxLoading) {
    return window._anymapTsMapboxLoading;
  }

  window._anymapTsMapboxLoading = (async () => {
    const mod = await import('https://esm.sh/mapbox-gl@3');
    // esm.sh may wrap the module in a default export
    // Return the Map constructor directly (either from module or mod.default)
    const mapboxgl = (mod as any).default || mod;
    return mapboxgl;
  })();
  
  try {
    const mapbox = await window._anymapTsMapboxLoading;
    window._anymapTsMapboxLoaded = true;
    return mapbox;
  } catch (error) {
    window._anymapTsMapboxLoading = undefined;
    throw error;
  }
}

/**
 * anywidget render function.
 * Uses dynamic imports to load Mapbox from CDN.
 */
async function render({ model, el }: { model: AnyModel; el: HTMLElement }): Promise<() => void> {
  // Clean up previous instance if exists
  if (el._mapboxRenderer) {
    el._mapboxRenderer.destroy();
    delete el._mapboxRenderer;
  }

  // Load CSS
  loadAllCSS();

  try {
    // Load Mapbox GL JS from CDN
    const mapboxModule = await loadMapbox();

    // Dynamically import the renderer class
    const { MapboxRenderer: RendererClass } = await import('./MapboxRenderer');

    // Create renderer with loaded mapbox module
    const renderer = new RendererClass(model as any, el, mapboxModule);
    el._mapboxRenderer = renderer;

    // Initialize asynchronously
    renderer.initialize().catch((error: Error) => {
      console.error('Failed to initialize Mapbox map:', error);
    });

    // Return cleanup function
    return () => {
      if (el._mapboxRenderer) {
        el._mapboxRenderer.destroy();
        delete el._mapboxRenderer;
      }
    };
  } catch (error) {
    console.error('Failed to load Mapbox from CDN:', error);
    el.innerHTML = '<div style="padding: 20px; color: red;">Failed to load map library. Please check your internet connection.</div>';
    return () => {};
  }
}

export default { render };
