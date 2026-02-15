/**
 * MapLibre module entry point for anywidget.
 */

import { MapLibreRenderer } from './MapLibreRenderer';
import type { AnyModel } from '@anywidget/types';
import { addProtocol } from 'maplibre-gl';
import { Protocol } from 'pmtiles';

// Import MapLibre CSS
import 'maplibre-gl/dist/maplibre-gl.css';
// Import Geoman and GeoEditor CSS
import '@geoman-io/maplibre-geoman-free/dist/maplibre-geoman.css';
import 'maplibre-gl-geo-editor/style.css';
// Import Layer Control CSS
import 'maplibre-gl-layer-control/style.css';
// Import LiDAR Control CSS
import 'maplibre-gl-lidar/style.css';

// Register PMTiles protocol globally (must be called once before any map is created)
const pmtilesProtocol = new Protocol();
addProtocol('pmtiles', pmtilesProtocol.tile);

/**
 * Extended model interface with renderer storage.
 */
interface ModelWithRenderer extends AnyModel {
  _maplibreRenderer?: MapLibreRenderer;
  _maplibreInitialized?: boolean;
  _maplibreCleanupScheduled?: boolean;
}

/**
 * anywidget render function.
 * Using synchronous function with internal promise handling for better compatibility.
 */
function render({ model, el }: { model: AnyModel; el: HTMLElement }): () => void {
  const extModel = model as ModelWithRenderer;

  // Cancel any scheduled cleanup since we're rendering again
  extModel._maplibreCleanupScheduled = false;

  // Check if we already have a renderer stored on the model
  if (extModel._maplibreRenderer && extModel._maplibreInitialized) {
    const renderer = extModel._maplibreRenderer;
    const map = renderer.getMap();
    const mapContainer = renderer.getMapContainer();

    // If the map container exists and is already within this el, just resize and reuse
    if (map && mapContainer && el.contains(mapContainer)) {
      map.resize();
      return () => {
        // Schedule cleanup but don't execute immediately
        // This allows a subsequent render() call to cancel it
        extModel._maplibreCleanupScheduled = true;
        setTimeout(() => {
          if (extModel._maplibreCleanupScheduled && extModel._maplibreRenderer) {
            extModel._maplibreRenderer.destroy();
            delete extModel._maplibreRenderer;
            delete extModel._maplibreInitialized;
            delete extModel._maplibreCleanupScheduled;
          }
        }, 100);
      };
    }

    // Fallback: destroy existing and create new
    renderer.destroy();
    delete extModel._maplibreRenderer;
    delete extModel._maplibreInitialized;
  }

  // Create new renderer
  const renderer = new MapLibreRenderer(model as any, el);
  extModel._maplibreRenderer = renderer;
  extModel._maplibreInitialized = false;

  renderer.initialize().then(() => {
    extModel._maplibreInitialized = true;
  }).catch((error) => {
    console.error('Failed to initialize map:', error);
  });

  // Return cleanup function
  return () => {
    extModel._maplibreCleanupScheduled = true;
    setTimeout(() => {
      if (extModel._maplibreCleanupScheduled && extModel._maplibreRenderer) {
        extModel._maplibreRenderer.destroy();
        delete extModel._maplibreRenderer;
        delete extModel._maplibreInitialized;
        delete extModel._maplibreCleanupScheduled;
      }
    }, 100);
  };
}

export default { render };
export { MapLibreRenderer };
