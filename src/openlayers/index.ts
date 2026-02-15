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
  _olCleanupScheduled?: boolean;
}

export function render({ model, el }: RenderContext): () => void {
  const extModel = model as ModelWithRenderer;

  // Cancel any scheduled cleanup since we're rendering again
  extModel._olCleanupScheduled = false;

  if (extModel._olRenderer) {
    const renderer = extModel._olRenderer;
    const map = renderer.getMap();
    // For OpenLayers, get the target element from the map itself
    const mapTarget = map?.getTargetElement() as HTMLElement | undefined;

    // Only reuse if map target is already in el (same host element)
    if (map && mapTarget && el.contains(mapTarget)) {
      map.updateSize();
      return () => {
        extModel._olCleanupScheduled = true;
        setTimeout(() => {
          if (extModel._olCleanupScheduled && extModel._olRenderer === renderer) {
            renderer.destroy();
            delete extModel._olRenderer;
            delete extModel._olCleanupScheduled;
          }
        }, 100);
      };
    }

    // Different host element or no map yet - destroy existing renderer
    renderer.destroy();
    delete extModel._olRenderer;
  }

  const renderer = new OpenLayersRenderer(model, el);
  extModel._olRenderer = renderer;

  renderer.initialize().catch((error) => {
    console.error('Failed to initialize OpenLayers map:', error);
  });

  return () => {
    extModel._olCleanupScheduled = true;
    setTimeout(() => {
      if (extModel._olCleanupScheduled && extModel._olRenderer === renderer) {
        renderer.destroy();
        delete extModel._olRenderer;
        delete extModel._olCleanupScheduled;
      }
    }, 100);
  };
}

export default { render };
