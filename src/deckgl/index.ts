/**
 * DeckGL map widget entry point.
 * Extends MapLibre with deck.gl visualization layers.
 */

import 'maplibre-gl/dist/maplibre-gl.css';
import { DeckGLRenderer } from './DeckGLRenderer';
import type { RenderContext } from '../types/anywidget';

/**
 * Extended model interface with renderer storage.
 */
interface ModelWithRenderer extends RenderContext['model'] {
  _deckglRenderer?: DeckGLRenderer;
  _deckglCleanupScheduled?: boolean;
}

function render({ model, el }: RenderContext): () => void {
  const extModel = model as ModelWithRenderer;

  // Cancel any scheduled cleanup since we're rendering again
  extModel._deckglCleanupScheduled = false;

  if (extModel._deckglRenderer) {
    const renderer = extModel._deckglRenderer;
    const map = renderer.getMap();
    const mapContainer = renderer.getMapContainer();

    // Only reuse if container is already in el (same host element)
    if (map && mapContainer && el.contains(mapContainer)) {
      map.resize();
      return () => {
        extModel._deckglCleanupScheduled = true;
        setTimeout(() => {
          if (extModel._deckglCleanupScheduled && extModel._deckglRenderer === renderer) {
            renderer.destroy();
            delete extModel._deckglRenderer;
            delete extModel._deckglCleanupScheduled;
          }
        }, 100);
      };
    }

    // Different host element or no map yet - destroy existing renderer
    renderer.destroy();
    delete extModel._deckglRenderer;
  }

  const renderer = new DeckGLRenderer(model, el);
  extModel._deckglRenderer = renderer;

  renderer.initialize().catch((error) => {
    console.error('Failed to initialize DeckGL map:', error);
  });

  return () => {
    extModel._deckglCleanupScheduled = true;
    setTimeout(() => {
      if (extModel._deckglCleanupScheduled && extModel._deckglRenderer === renderer) {
        renderer.destroy();
        delete extModel._deckglRenderer;
        delete extModel._deckglCleanupScheduled;
      }
    }, 100);
  };
}

export default { render };
