/**
 * OpenLayers map widget entry point.
 */

import 'ol/ol.css';
import { OpenLayersRenderer } from './OpenLayersRenderer';
import type { MapWidgetModel, RenderContext } from '../types/anywidget';

/**
 * Extended model interface with renderer storage.
 */
interface ModelWithRenderer extends MapWidgetModel {
  _olRenderer?: OpenLayersRenderer;
  _olInitialized?: boolean;
  _olCleanupScheduled?: boolean;
}

export function render({ model, el }: RenderContext): () => void {
  const extModel = model as ModelWithRenderer;

  // Cancel any scheduled cleanup since we're rendering again
  extModel._olCleanupScheduled = false;

  if (extModel._olRenderer && extModel._olInitialized) {
    const renderer = extModel._olRenderer;
    const map = renderer.getMap();
    const mapContainer = renderer.getMapContainer();

    if (map && mapContainer) {
      if (!el.contains(mapContainer)) {
        while (el.firstChild) {
          el.removeChild(el.firstChild);
        }
        el.appendChild(mapContainer);
      }
      map.updateSize();
      return () => {
        extModel._olCleanupScheduled = true;
        setTimeout(() => {
          if (extModel._olCleanupScheduled && extModel._olRenderer) {
            extModel._olRenderer.destroy();
            delete extModel._olRenderer;
            delete extModel._olInitialized;
            delete extModel._olCleanupScheduled;
          }
        }, 100);
      };
    }

    renderer.destroy();
    delete extModel._olRenderer;
    delete extModel._olInitialized;
  }

  const renderer = new OpenLayersRenderer(model, el);
  extModel._olRenderer = renderer;
  extModel._olInitialized = false;

  renderer.initialize().then(() => {
    extModel._olInitialized = true;
  }).catch((error) => {
    console.error('Failed to initialize OpenLayers map:', error);
  });

  return () => {
    extModel._olCleanupScheduled = true;
    setTimeout(() => {
      if (extModel._olCleanupScheduled && extModel._olRenderer) {
        extModel._olRenderer.destroy();
        delete extModel._olRenderer;
        delete extModel._olInitialized;
        delete extModel._olCleanupScheduled;
      }
    }, 100);
  };
}

export default { render };
