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
 * Store renderer reference on element for cleanup and multi-cell support.
 */
declare global {
  interface HTMLElement {
    _mapRenderer?: MapLibreRenderer;
    _mapRendererCleanupTimer?: number;
  }
}

/**
 * anywidget render function.
 * Using synchronous function with internal promise handling for better compatibility.
 */
function render({ model, el }: { model: AnyModel; el: HTMLElement }): () => void {
  if (el._mapRendererCleanupTimer) {
    clearTimeout(el._mapRendererCleanupTimer);
    delete el._mapRendererCleanupTimer;
  }

  // Reuse existing renderer when possible to avoid flicker/state loss
  if (el._mapRenderer && el._mapRenderer.getModel() === model) {
    el._mapRenderer.refreshLayout();
    const existingRenderer = el._mapRenderer;
    return () => {
      el._mapRendererCleanupTimer = window.setTimeout(() => {
        if (el._mapRenderer === existingRenderer) {
          existingRenderer.destroy();
          delete el._mapRenderer;
        }
        delete el._mapRendererCleanupTimer;
      }, 120);
    };
  }

  if (el._mapRenderer) {
    el._mapRenderer.destroy();
    delete el._mapRenderer;
  }

  const renderer = new MapLibreRenderer(model as any, el);
  el._mapRenderer = renderer;

  renderer.initialize().catch((error) => {
    console.error('Failed to initialize map:', error);
  });

  return () => {
    el._mapRendererCleanupTimer = window.setTimeout(() => {
      if (el._mapRenderer === renderer) {
        renderer.destroy();
        delete el._mapRenderer;
      }
      delete el._mapRendererCleanupTimer;
    }, 120);
  };
}

export default { render };
export { MapLibreRenderer };
