/**
 * DeckGL map widget entry point.
 * Extends MapLibre with deck.gl visualization layers.
 */

import 'maplibre-gl/dist/maplibre-gl.css';
import { DeckGLRenderer } from './DeckGLRenderer';
import type { RenderContext } from '../types/anywidget';

/**
 * Store renderer reference on element for cleanup and multi-cell support.
 */
declare global {
  interface HTMLElement {
    _deckRenderer?: DeckGLRenderer;
  }
}

function render({ model, el }: RenderContext): () => void {
  // Clean up previous instance if exists
  if (el._deckRenderer) {
    el._deckRenderer.destroy();
    delete el._deckRenderer;
  }

  // Create new renderer
  const renderer = new DeckGLRenderer(model, el);
  el._deckRenderer = renderer;

  // Initialize the map
  renderer.initialize().catch((error) => {
    console.error('Failed to initialize DeckGL map:', error);
  });

  // Return cleanup function
  return () => {
    if (el._deckRenderer) {
      el._deckRenderer.destroy();
      delete el._deckRenderer;
    }
  };
}

export default { render };
