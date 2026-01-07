/**
 * MapLibre module entry point for anywidget.
 */

import { MapLibreRenderer } from './MapLibreRenderer';
import type { AnyModel } from '@anywidget/types';

// Import MapLibre CSS
import 'maplibre-gl/dist/maplibre-gl.css';
// Import Geoman and GeoEditor CSS
import '@geoman-io/maplibre-geoman-free/dist/maplibre-geoman.css';
import 'maplibre-gl-geo-editor/style.css';
// Import Layer Control CSS
import 'maplibre-gl-layer-control/style.css';

/**
 * Store renderer reference on element for cleanup and multi-cell support.
 */
declare global {
  interface HTMLElement {
    _mapRenderer?: MapLibreRenderer;
  }
}

/**
 * anywidget render function.
 * Using synchronous function with internal promise handling for better compatibility.
 */
function render({ model, el }: { model: AnyModel; el: HTMLElement }): () => void {
  // Clean up previous instance if exists
  if (el._mapRenderer) {
    el._mapRenderer.destroy();
    delete el._mapRenderer;
  }

  // Create new renderer
  const renderer = new MapLibreRenderer(model as any, el);
  el._mapRenderer = renderer;

  // Initialize asynchronously (don't await - let it run in background)
  renderer.initialize().catch((error) => {
    console.error('Failed to initialize map:', error);
  });

  // Return cleanup function
  return () => {
    if (el._mapRenderer) {
      el._mapRenderer.destroy();
      delete el._mapRenderer;
    }
  };
}

export default { render };
export { MapLibreRenderer };
