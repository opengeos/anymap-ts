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
  resolveLayerOrder?: () => string[];
  onLayerReorder?: (layerOrder: string[]) => void;
}

interface LayerControlInternal {
  state?: {
    layerStates?: Record<string, unknown>;
  };
  targetLayers?: string[];
  buildLayerItems?: () => void;
}

/**
 * Plugin for integrating maplibre-gl-layer-control.
 */
export class LayerControlPlugin {
  private map: MapLibreMap;
  private control: LayerControl | null = null;
  private resolveLayerOrder: (() => string[]) | null = null;

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
      resolveLayerOrder,
      onLayerReorder,
    } = options;

    this.resolveLayerOrder = resolveLayerOrder ?? null;

    this.control = new LayerControl({
      layers,
      collapsed,
      customLayerAdapters,
      excludeLayers,
      onLayerReorder,
    });

    this.map.addControl(this.control, position);
    this.syncLayerOrder();
  }

  /**
   * Get the layer control instance.
   */
  getControl(): LayerControl | null {
    return this.control;
  }

  /**
   * Rebuild the layer list using a caller-provided order.
   * This lets custom layers (for example deck.gl overlays) appear in the same
   * relative position as their actual render stack on the map.
   */
  syncLayerOrder(): void {
    if (!this.control || !this.resolveLayerOrder) {
      return;
    }

    const internal = this.control as unknown as LayerControlInternal;
    const layerStates = internal.state?.layerStates;
    if (!layerStates || typeof internal.buildLayerItems !== 'function') {
      return;
    }

    const desiredOrder = this.resolveLayerOrder();
    if (desiredOrder.length === 0) {
      return;
    }

    const currentOrder = Object.keys(layerStates);
    const hasBackground = currentOrder.includes('Background');
    const currentLayerIds = currentOrder.filter(layerId => layerId !== 'Background');
    const currentSet = new Set(currentLayerIds);
    const desiredSet = new Set(desiredOrder);

    const reorderedIds = [
      ...desiredOrder.filter(layerId => currentSet.has(layerId)),
      ...currentLayerIds.filter(layerId => !desiredSet.has(layerId)),
    ];

    if (reorderedIds.length === 0) {
      return;
    }

    const isSameOrder = reorderedIds.length === currentLayerIds.length &&
      reorderedIds.every((layerId, index) => layerId === currentLayerIds[index]);
    if (isSameOrder) {
      return;
    }

    const reorderedStates: Record<string, unknown> = {};
    if (hasBackground && Object.prototype.hasOwnProperty.call(layerStates, 'Background')) {
      reorderedStates.Background = layerStates.Background;
    }
    reorderedIds.forEach((layerId) => {
      reorderedStates[layerId] = layerStates[layerId];
    });

    if (internal.state) {
      internal.state.layerStates = reorderedStates;
    }
    internal.targetLayers = hasBackground ? ['Background', ...reorderedIds] : [...reorderedIds];
    internal.buildLayerItems();
  }

  /**
   * Destroy the layer control.
   */
  destroy(): void {
    if (this.control) {
      this.map.removeControl(this.control);
      this.control = null;
    }
    this.resolveLayerOrder = null;
  }
}
