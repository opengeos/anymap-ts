/**
 * Cesium 3D globe widget entry point.
 */

import 'cesium/Build/Cesium/Widgets/widgets.css';
import { CesiumRenderer } from './CesiumRenderer';
import type { MapWidgetModel, RenderContext } from '../types/anywidget';

let renderer: CesiumRenderer | null = null;

export function render({ model, el }: RenderContext): () => void {
  renderer = new CesiumRenderer(model, el);

  // Initialize the viewer
  renderer.initialize().catch((error) => {
    console.error('Failed to initialize Cesium viewer:', error);
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
