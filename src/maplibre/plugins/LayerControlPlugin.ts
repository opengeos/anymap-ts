/**
 * MapLibre GL Layer Control plugin integration.
 */

import type { Map as MapLibreMap } from 'maplibre-gl';
import { LayerControl } from 'maplibre-gl-layer-control';
import type { CustomLayerAdapter } from 'maplibre-gl-layer-control';
import type { ControlPosition } from '../../types/maplibre';

export interface LayerControlOptions {
  layers?: string[];
  position?: ControlPosition;
  collapsed?: boolean;
  customLayerAdapters?: CustomLayerAdapter[];
  excludeLayers?: string[];
}

/**
 * Plugin for integrating maplibre-gl-layer-control.
 */
export class LayerControlPlugin {
  private map: MapLibreMap;
  private control: LayerControl | null = null;
  private buttonClickHandler: ((e: MouseEvent) => void) | null = null;

  constructor(map: MapLibreMap) {
    this.map = map;
  }

  /**
   * Initialize the layer control.
   */
  initialize(options: LayerControlOptions): void {
    if (this.control) {
      this.destroy();
    }

    const { layers, position = 'top-right', collapsed = false, customLayerAdapters, excludeLayers } = options;

    this.control = new LayerControl({
      layers,
      collapsed,
      customLayerAdapters,
      excludeLayers,
    });

    this.map.addControl(this.control, position);

    // Fix for Panel/IPyWidget compatibility:
    // The layer control uses document.addEventListener("click") which doesn't
    // work properly when the widget is embedded in Panel (due to shadow DOM
    // or event propagation issues). We add a click handler on the button that
    // stops propagation to prevent the document listener from interfering.
    this.fixPanelCompatibility();
  }

  /**
   * Fix compatibility with Panel library.
   *
   * Panel wraps ipywidgets in a way that can interfere with document-level
   * event listeners. This method adds event handlers to ensure the layer
   * control button works properly.
   */
  private fixPanelCompatibility(): void {
    // Find the layer control container
    const container = this.map.getContainer();
    const controlContainer = container.querySelector('.maplibregl-ctrl-layer-control');

    if (!controlContainer) {
      // Retry after a short delay if not found immediately
      setTimeout(() => this.fixPanelCompatibility(), 100);
      return;
    }

    const button = controlContainer.querySelector('button');
    if (!button) return;

    // Add a capture-phase click handler that stops propagation
    // This prevents the document-level click handler from closing the panel
    // immediately after it opens
    this.buttonClickHandler = (e: MouseEvent) => {
      e.stopPropagation();
    };

    button.addEventListener('click', this.buttonClickHandler, true);

    // Also add mousedown handler to ensure events reach the button
    button.addEventListener('mousedown', (e: MouseEvent) => {
      e.stopPropagation();
    }, true);
  }

  /**
   * Get the layer control instance.
   */
  getControl(): LayerControl | null {
    return this.control;
  }

  /**
   * Destroy the layer control.
   */
  destroy(): void {
    // Clean up button click handler
    if (this.buttonClickHandler) {
      const container = this.map.getContainer();
      const controlContainer = container.querySelector('.maplibregl-ctrl-layer-control');
      const button = controlContainer?.querySelector('button');
      if (button) {
        button.removeEventListener('click', this.buttonClickHandler, true);
      }
      this.buttonClickHandler = null;
    }

    if (this.control) {
      this.map.removeControl(this.control);
      this.control = null;
    }
  }
}
