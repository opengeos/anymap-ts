/**
 * MapLibre module entry point for anywidget.
 * Uses CDN imports to keep the ESM module small.
 */

import type { AnyModel } from '@anywidget/types';
import type { MapLibreRenderer } from './MapLibreRenderer';
import '../styles/maplibre.css';

// CSS will be loaded dynamically via CDN
const MAPLIBRE_CSS_URL = 'https://esm.sh/maplibre-gl@5/dist/maplibre-gl.css';
const GEOMAN_CSS_URL = 'https://esm.sh/@geoman-io/maplibre-geoman-free@0.6.2/dist/maplibre-geoman.css';
const GEOEDITOR_CSS_URL = 'https://esm.sh/maplibre-gl-geo-editor@0.7.3/style.css';
const LAYER_CONTROL_CSS_URL = 'https://esm.sh/maplibre-gl-layer-control@0.14.0/style.css';
const LIDAR_CSS_URL = 'https://esm.sh/maplibre-gl-lidar@0.11.1/style.css';

// Track if CSS has been loaded
let cssLoaded = false;

/**
 * Dynamically load CSS if not already loaded
 */
function loadCSS(url: string): void {
  // Check if already loaded
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
  loadCSS(GEOMAN_CSS_URL);
  loadCSS(GEOEDITOR_CSS_URL);
  loadCSS(LAYER_CONTROL_CSS_URL);
  loadCSS(LIDAR_CSS_URL);

  cssLoaded = true;
}

/**
 * Store renderer reference on element for cleanup and multi-cell support.
 */
declare global {
  interface HTMLElement {
    _mapRenderer?: MapLibreRenderer;
  }
  interface Window {
    _anymapTsMaplibreLoaded?: boolean;
    _anymapTsMaplibreLoading?: Promise<typeof import('maplibre-gl')>;
    _anymapTsPmtilesRegistered?: boolean;
  }
}

/**
 * Dynamically import maplibre-gl from CDN with caching
 */
async function loadMapLibre(): Promise<typeof import('maplibre-gl')> {
  // If already loaded, return it
  if (window._anymapTsMaplibreLoaded && window._anymapTsMaplibreLoading) {
    return window._anymapTsMaplibreLoading;
  }

  // If currently loading, return the existing promise
  if (window._anymapTsMaplibreLoading) {
    return window._anymapTsMaplibreLoading;
  }

  // Start loading
  window._anymapTsMaplibreLoading = import('https://esm.sh/maplibre-gl@5');

  try {
    const maplibre = await window._anymapTsMaplibreLoading;
    window._anymapTsMaplibreLoaded = true;
    return maplibre;
  } catch (error) {
    window._anymapTsMaplibreLoading = undefined;
    throw error;
  }
}

/**
 * anywidget render function.
 * Uses dynamic imports to load MapLibre from CDN.
 */
async function render({ model, el }: { model: AnyModel; el: HTMLElement }): Promise<() => void> {
  // Clean up previous instance if exists
  if (el._mapRenderer) {
    el._mapRenderer.destroy();
    delete el._mapRenderer;
  }

  // Load CSS
  loadAllCSS();

  // Dynamically load MapLibre and create renderer
  try {
    // Load MapLibre GL JS from CDN
    const maplibreModule = await loadMapLibre();

    // Dynamically import PMTiles
    const { Protocol } = await import('https://esm.sh/pmtiles@4.4.0');

    // Register PMTiles protocol globally (must be called once before any map is created)
    if (!window._anymapTsPmtilesRegistered) {
      const pmtilesProtocol = new Protocol();
      maplibreModule.addProtocol('pmtiles', pmtilesProtocol.tile);
      window._anymapTsPmtilesRegistered = true;
    }

    // Dynamically import the renderer class
    const { MapLibreRenderer: RendererClass } = await import('./MapLibreRenderer');

    // Create renderer with loaded maplibre module
    const renderer = new RendererClass(model as any, el, maplibreModule);
    el._mapRenderer = renderer;

    // Initialize asynchronously
    renderer.initialize().catch((error: Error) => {
      console.error('Failed to initialize map:', error);
    });

    // Return cleanup function
    return () => {
      if (el._mapRenderer) {
        el._mapRenderer.destroy();
        delete el._mapRenderer;
      }
    };
  } catch (error) {
    console.error('Failed to load MapLibre from CDN:', error);
    el.innerHTML = '<div style="padding: 20px; color: red;">Failed to load map library. Please check your internet connection.</div>';
    return () => {};
  }
}

export default { render };
