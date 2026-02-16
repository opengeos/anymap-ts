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
  onLayerRemove?: (layerId: string) => void;
}

/**
 * Plugin for integrating maplibre-gl-layer-control.
 */
export class LayerControlPlugin {
  private map: MapLibreMap;
  private control: LayerControl | null = null;

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

    const {
      layers,
      position = 'top-right',
      collapsed = false,
      customLayerAdapters,
      excludeLayers,
      onLayerRemove,
    } = options;

    this.control = new LayerControl({
      layers,
      collapsed,
      customLayerAdapters,
      excludeLayers,
      onLayerRemove,
    });

    this.map.addControl(this.control, position);
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
    if (this.control) {
      this.map.removeControl(this.control);
      this.control = null;
    }
  }
}
