/**
 * Leaflet module entry point for anywidget.
 */

import { LeafletRenderer } from './LeafletRenderer';
import type { AnyModel } from '@anywidget/types';

// Import Leaflet CSS
import 'leaflet/dist/leaflet.css';
import './leaflet-overrides.css';

// Fix Leaflet default marker icons when bundled (esbuild inlines PNGs as data URLs)
// @ts-ignore - Import as data URL via esbuild loader
import markerIcon from 'leaflet/dist/images/marker-icon.png';
// @ts-ignore
import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png';
// @ts-ignore
import markerShadow from 'leaflet/dist/images/marker-shadow.png';
import * as L from 'leaflet/dist/leaflet-src.esm.js';

// @ts-ignore - Override prototype to fix icon paths for bundled builds
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconUrl: markerIcon,
  iconRetinaUrl: markerIcon2x,
  shadowUrl: markerShadow,
});

/**
 * Store renderer reference on element for cleanup and multi-cell support.
 */
declare global {
  interface HTMLElement {
    _leafletRenderer?: LeafletRenderer;
  }
}

/**
 * anywidget render function.
 */
function render({ model, el }: { model: AnyModel; el: HTMLElement }): () => void {
  // Clean up previous instance if exists
  if (el._leafletRenderer) {
    el._leafletRenderer.destroy();
    delete el._leafletRenderer;
  }

  // Create new renderer
  const renderer = new LeafletRenderer(model as any, el);
  el._leafletRenderer = renderer;

  // Initialize asynchronously
  renderer.initialize().catch((error) => {
    console.error('Failed to initialize Leaflet map:', error);
  });

  // Return cleanup function
  return () => {
    if (el._leafletRenderer) {
      el._leafletRenderer.destroy();
      delete el._leafletRenderer;
    }
  };
}

export default { render };
export { LeafletRenderer };
