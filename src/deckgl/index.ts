/**
 * DeckGL map widget entry point.
 * Extends MapLibre with deck.gl visualization layers.
 */

import 'maplibre-gl/dist/maplibre-gl.css';
import { DeckGLRenderer } from './DeckGLRenderer';
import type { MapWidgetModel, RenderContext } from '../types/anywidget';

let renderer: DeckGLRenderer | null = null;

export function render({ model, el }: RenderContext): () => void {
  renderer = new DeckGLRenderer(model, el);

  // Initialize the map
  renderer.initialize().catch((error) => {
    console.error('Failed to initialize DeckGL map:', error);
  });

  // Return cleanup function
  return () => {
    if (renderer) {
      renderer.destroy();
      renderer = null;
    }
  };
}

export default { render };
