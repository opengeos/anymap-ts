/**
 * Leaflet module entry point for anywidget.
 */

import { LeafletRenderer } from './LeafletRenderer';
import type { AnyModel } from '@anywidget/types';

// Import Leaflet CSS
import 'leaflet/dist/leaflet.css';

/**
 * Extended model interface with renderer storage.
 */
interface ModelWithRenderer extends AnyModel {
  _leafletRenderer?: LeafletRenderer;
  _leafletCleanupScheduled?: boolean;
}

/**
 * anywidget render function.
 */
function render({ model, el }: { model: AnyModel; el: HTMLElement }): () => void {
  const extModel = model as ModelWithRenderer;

  // Cancel any scheduled cleanup since we're rendering again
  extModel._leafletCleanupScheduled = false;

  if (extModel._leafletRenderer) {
    const renderer = extModel._leafletRenderer;
    const map = renderer.getMap();
    const mapContainer = renderer.getMapContainer();

    // Only reuse if container is already in el (same host element)
    if (map && mapContainer && el.contains(mapContainer)) {
      map.invalidateSize();
      return () => {
        extModel._leafletCleanupScheduled = true;
        setTimeout(() => {
          if (extModel._leafletCleanupScheduled && extModel._leafletRenderer === renderer) {
            renderer.destroy();
            delete extModel._leafletRenderer;
            delete extModel._leafletCleanupScheduled;
          }
        }, 100);
      };
    }

    // Different host element or no map yet - destroy existing renderer
    renderer.destroy();
    delete extModel._leafletRenderer;
  }

  const renderer = new LeafletRenderer(model as any, el);
  extModel._leafletRenderer = renderer;

  renderer.initialize().catch((error) => {
    console.error('Failed to initialize Leaflet map:', error);
  });

  return () => {
    extModel._leafletCleanupScheduled = true;
    setTimeout(() => {
      if (extModel._leafletCleanupScheduled && extModel._leafletRenderer === renderer) {
        renderer.destroy();
        delete extModel._leafletRenderer;
        delete extModel._leafletCleanupScheduled;
      }
    }, 100);
  };
}

export default { render };
export { LeafletRenderer };
