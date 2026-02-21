/**
 * MapLibre GL Layer Control plugin integration.
 * Uses dynamic CDN imports.
 */

import type { Map as MapLibreMap } from 'maplibre-gl';
import type { ControlPosition } from '../../types/maplibre';

// Dynamic import helper
async function loadLayerControl() {
  const mod = await import('https://esm.sh/maplibre-gl-layer-control@0.14.0');
  return { LayerControl: mod.LayerControl };
}

// Type for custom layer adapters
export interface CustomLayerAdapter {
  id: string;
  getVisibility(): boolean;
  setVisibility(visible: boolean): void;
  getMetadata?(): Record<string, unknown>;
}

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
  private control: any | null = null;

  constructor(map: MapLibreMap) {
    this.map = map;
  }

  /**
   * Initialize the layer control.
   */
  async initialize(options: LayerControlOptions): Promise<void> {
    if (this.control) {
      this.destroy();
    }

    const { layers, position = 'top-right', collapsed = false, customLayerAdapters, excludeLayers } = options;

    const { LayerControl } = await loadLayerControl();

    this.control = new LayerControl({
      layers,
      collapsed,
      customLayerAdapters,
      excludeLayers,
    });

    this.map.addControl(this.control, position);
  }

  /**
   * Get the layer control instance.
   */
  getControl(): any | null {
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
