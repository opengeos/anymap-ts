/**
 * Leaflet module entry point for anywidget.
 */

import { LeafletRenderer } from './LeafletRenderer';
import type { AnyModel } from '@anywidget/types';

// Import Leaflet CSS
import 'leaflet/dist/leaflet.css';

/**
 * Store renderer reference on element for cleanup and multi-cell support.
 */
declare global {
  interface HTMLElement {
    _leafletRenderer?: LeafletRenderer;
  }
}

/**
 * anywidget render function.
 */
function render({ model, el }: { model: AnyModel; el: HTMLElement }): () => void {
  // Clean up previous instance if exists
  if (el._leafletRenderer) {
    el._leafletRenderer.destroy();
    delete el._leafletRenderer;
  }

  // Create new renderer
  const renderer = new LeafletRenderer(model as any, el);
  el._leafletRenderer = renderer;

  // Initialize asynchronously
  renderer.initialize().catch((error) => {
    console.error('Failed to initialize Leaflet map:', error);
  });

  // Return cleanup function
  return () => {
    if (el._leafletRenderer) {
      el._leafletRenderer.destroy();
      delete el._leafletRenderer;
    }
  };
}

export default { render };
export { LeafletRenderer };
