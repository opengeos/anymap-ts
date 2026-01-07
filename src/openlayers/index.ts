/**
 * OpenLayers map widget entry point.
 */

import 'ol/ol.css';
import { OpenLayersRenderer } from './OpenLayersRenderer';
import type { MapWidgetModel, RenderContext } from '../types/anywidget';

let renderer: OpenLayersRenderer | null = null;

export function render({ model, el }: RenderContext): () => void {
  renderer = new OpenLayersRenderer(model, el);

  // Initialize the map
  renderer.initialize().catch((error) => {
    console.error('Failed to initialize OpenLayers map:', error);
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
