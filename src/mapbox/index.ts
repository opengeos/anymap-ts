/**
 * Mapbox module entry point for anywidget.
 */

import { MapboxRenderer } from './MapboxRenderer';
import type { AnyModel } from '@anywidget/types';

// Import Mapbox CSS
import 'mapbox-gl/dist/mapbox-gl.css';
// Import LiDAR Control CSS
import 'maplibre-gl-lidar/style.css';

/**
 * Extended model interface with renderer storage.
 */
interface ModelWithRenderer extends AnyModel {
  _mapboxRenderer?: MapboxRenderer;
  _mapboxInitialized?: boolean;
  _mapboxCleanupScheduled?: boolean;
}

/**
 * anywidget render function.
 */
function render({ model, el }: { model: AnyModel; el: HTMLElement }): () => void {
  const extModel = model as ModelWithRenderer;

  // Cancel any scheduled cleanup since we're rendering again
  extModel._mapboxCleanupScheduled = false;

  // Check if we already have a renderer stored on the model
  if (extModel._mapboxRenderer && extModel._mapboxInitialized) {
    const renderer = extModel._mapboxRenderer;
    const map = renderer.getMap();
    const mapContainer = renderer.getMapContainer();

    if (map && mapContainer) {
      if (!el.contains(mapContainer)) {
        while (el.firstChild) {
          el.removeChild(el.firstChild);
        }
        el.appendChild(mapContainer);
      }
      map.resize();
      return () => {
        extModel._mapboxCleanupScheduled = true;
        setTimeout(() => {
          if (extModel._mapboxCleanupScheduled && extModel._mapboxRenderer) {
            extModel._mapboxRenderer.destroy();
            delete extModel._mapboxRenderer;
            delete extModel._mapboxInitialized;
            delete extModel._mapboxCleanupScheduled;
          }
        }, 100);
      };
    }

    renderer.destroy();
    delete extModel._mapboxRenderer;
    delete extModel._mapboxInitialized;
  }

  // Create new renderer
  const renderer = new MapboxRenderer(model as any, el);
  extModel._mapboxRenderer = renderer;
  extModel._mapboxInitialized = false;

  renderer.initialize().then(() => {
    extModel._mapboxInitialized = true;
  }).catch((error) => {
    console.error('Failed to initialize Mapbox map:', error);
  });

  return () => {
    extModel._mapboxCleanupScheduled = true;
    setTimeout(() => {
      if (extModel._mapboxCleanupScheduled && extModel._mapboxRenderer) {
        extModel._mapboxRenderer.destroy();
        delete extModel._mapboxRenderer;
        delete extModel._mapboxInitialized;
        delete extModel._mapboxCleanupScheduled;
      }
    }, 100);
  };
}

export default { render };
export { MapboxRenderer };
