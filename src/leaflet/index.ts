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
  _leafletInitialized?: boolean;
  _leafletCleanupScheduled?: boolean;
}

/**
 * anywidget render function.
 */
function render({ model, el }: { model: AnyModel; el: HTMLElement }): () => void {
  const extModel = model as ModelWithRenderer;

  // Cancel any scheduled cleanup since we're rendering again
  extModel._leafletCleanupScheduled = false;

  if (extModel._leafletRenderer && extModel._leafletInitialized) {
    const renderer = extModel._leafletRenderer;
    const map = renderer.getMap();
    const mapContainer = renderer.getMapContainer();

    if (map && mapContainer) {
      if (!el.contains(mapContainer)) {
        while (el.firstChild) {
          el.removeChild(el.firstChild);
        }
        el.appendChild(mapContainer);
      }
      map.invalidateSize();
      return () => {
        extModel._leafletCleanupScheduled = true;
        setTimeout(() => {
          if (extModel._leafletCleanupScheduled && extModel._leafletRenderer) {
            extModel._leafletRenderer.destroy();
            delete extModel._leafletRenderer;
            delete extModel._leafletInitialized;
            delete extModel._leafletCleanupScheduled;
          }
        }, 100);
      };
    }

    renderer.destroy();
    delete extModel._leafletRenderer;
    delete extModel._leafletInitialized;
  }

  const renderer = new LeafletRenderer(model as any, el);
  extModel._leafletRenderer = renderer;
  extModel._leafletInitialized = false;

  renderer.initialize().then(() => {
    extModel._leafletInitialized = true;
  }).catch((error) => {
    console.error('Failed to initialize Leaflet map:', error);
  });

  return () => {
    extModel._leafletCleanupScheduled = true;
    setTimeout(() => {
      if (extModel._leafletCleanupScheduled && extModel._leafletRenderer) {
        extModel._leafletRenderer.destroy();
        delete extModel._leafletRenderer;
        delete extModel._leafletInitialized;
        delete extModel._leafletCleanupScheduled;
      }
    }, 100);
  };
}

export default { render };
export { LeafletRenderer };
