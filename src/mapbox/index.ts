/**
 * Mapbox module entry point for anywidget.
 */

import { MapboxRenderer } from './MapboxRenderer';
import type { AnyModel } from '@anywidget/types';

// Import Mapbox CSS
import 'mapbox-gl/dist/mapbox-gl.css';

/**
 * Store renderer reference on element for cleanup and multi-cell support.
 */
declare global {
  interface HTMLElement {
    _mapboxRenderer?: MapboxRenderer;
  }
}

/**
 * anywidget render function.
 */
function render({ model, el }: { model: AnyModel; el: HTMLElement }): () => void {
  // Clean up previous instance if exists
  if (el._mapboxRenderer) {
    el._mapboxRenderer.destroy();
    delete el._mapboxRenderer;
  }

  // Create new renderer
  const renderer = new MapboxRenderer(model as any, el);
  el._mapboxRenderer = renderer;

  // Initialize asynchronously
  renderer.initialize().catch((error) => {
    console.error('Failed to initialize Mapbox map:', error);
  });

  // Return cleanup function
  return () => {
    if (el._mapboxRenderer) {
      el._mapboxRenderer.destroy();
      delete el._mapboxRenderer;
    }
  };
}

export default { render };
export { MapboxRenderer };
