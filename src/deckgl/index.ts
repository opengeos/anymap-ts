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
  _deckglInitialized?: boolean;
  _deckglCleanupScheduled?: boolean;
}

function render({ model, el }: RenderContext): () => void {
  const extModel = model as ModelWithRenderer;

  // Cancel any scheduled cleanup since we're rendering again
  extModel._deckglCleanupScheduled = false;

  if (extModel._deckglRenderer && extModel._deckglInitialized) {
    const renderer = extModel._deckglRenderer;
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
        extModel._deckglCleanupScheduled = true;
        setTimeout(() => {
          if (extModel._deckglCleanupScheduled && extModel._deckglRenderer) {
            extModel._deckglRenderer.destroy();
            delete extModel._deckglRenderer;
            delete extModel._deckglInitialized;
            delete extModel._deckglCleanupScheduled;
          }
        }, 100);
      };
    }

    renderer.destroy();
    delete extModel._deckglRenderer;
    delete extModel._deckglInitialized;
  }

  const renderer = new DeckGLRenderer(model, el);
  extModel._deckglRenderer = renderer;
  extModel._deckglInitialized = false;

  renderer.initialize().then(() => {
    extModel._deckglInitialized = true;
  }).catch((error) => {
    console.error('Failed to initialize DeckGL map:', error);
  });

  return () => {
    extModel._deckglCleanupScheduled = true;
    setTimeout(() => {
      if (extModel._deckglCleanupScheduled && extModel._deckglRenderer) {
        extModel._deckglRenderer.destroy();
        delete extModel._deckglRenderer;
        delete extModel._deckglInitialized;
        delete extModel._deckglCleanupScheduled;
      }
    }, 100);
  };
}

export default { render };
