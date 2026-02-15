/**
 * Zarr Layer Adapter for integrating Zarr layers with the layer control.
 */

import type { CustomLayerAdapter, LayerState } from 'maplibre-gl-layer-control';
import type { Map as MapLibreMap } from 'maplibre-gl';
import type { ZarrLayer } from '@carbonplan/zarr-layer';

/**
 * Extended ZarrLayer interface with internal properties.
 * Uses Record type to access internal properties without type conflicts.
 */
interface ZarrLayerInternal {
  _originalOpacity?: number;
  opacity?: number;
  setOpacity(opacity: number): void;
}

/**
 * Adapter for Zarr layers.
 * Allows the layer control to manage Zarr layers.
 */
export class ZarrLayerAdapter implements CustomLayerAdapter {
  readonly type = 'zarr';

  private map: MapLibreMap;
  private zarrLayers: globalThis.Map<string, ZarrLayer>;
  private layerVisibility: globalThis.Map<string, boolean> = new globalThis.Map();
  private changeCallbacks: Array<(event: 'add' | 'remove', layerId: string) => void> = [];

  constructor(map: MapLibreMap, zarrLayers: globalThis.Map<string, ZarrLayer>) {
    this.map = map;
    this.zarrLayers = zarrLayers;
  }

  /**
   * Get all Zarr layer IDs.
   */
  getLayerIds(): string[] {
    return Array.from(this.zarrLayers.keys());
  }

  /**
   * Get the state of a Zarr layer.
   */
  getLayerState(layerId: string): LayerState | null {
    const layer = this.zarrLayers.get(layerId) as unknown as ZarrLayerInternal | undefined;
    if (!layer) return null;

    const visible = this.layerVisibility.get(layerId) ?? true;
    const opacity = layer._originalOpacity ?? layer.opacity ?? 1;

    return {
      visible,
      opacity,
      name: this.getName(layerId),
    };
  }

  /**
   * Set visibility of a Zarr layer.
   * Uses opacity trick since ZarrLayer doesn't have setVisible.
   */
  setVisibility(layerId: string, visible: boolean): void {
    const layer = this.zarrLayers.get(layerId) as unknown as ZarrLayerInternal | undefined;
    if (!layer) return;

    this.layerVisibility.set(layerId, visible);

    if (visible) {
      // Restore original opacity
      const originalOpacity = layer._originalOpacity ?? 1;
      layer.setOpacity(originalOpacity);
    } else {
      // Store original opacity and hide by setting to 0
      if (layer._originalOpacity === undefined) {
        layer._originalOpacity = layer.opacity ?? 1;
      }
      layer.setOpacity(0);
    }

    // Trigger map repaint
    this.map.triggerRepaint();
  }

  /**
   * Set opacity of a Zarr layer.
   */
  setOpacity(layerId: string, opacity: number): void {
    const layer = this.zarrLayers.get(layerId) as unknown as ZarrLayerInternal | undefined;
    if (!layer) return;

    // Store as original opacity
    layer._originalOpacity = opacity;

    // Only apply if visible
    const visible = this.layerVisibility.get(layerId) ?? true;
    if (visible) {
      layer.setOpacity(opacity);
    }

    // Trigger map repaint
    this.map.triggerRepaint();
  }

  /**
   * Get the display name for a Zarr layer.
   */
  getName(layerId: string): string {
    // Convert layer ID to a friendly name
    return layerId
      .replace(/^zarr[-_]/, '')
      .replace(/[-_]/g, ' ')
      .replace(/\b\w/g, c => c.toUpperCase());
  }

  /**
   * Get the symbol type for Zarr layers.
   */
  getSymbolType(): string {
    return 'zarr';
  }

  /**
   * Notify that a layer was added.
   * Call this from MapLibreRenderer when a Zarr layer is added.
   */
  notifyLayerAdded(layerId: string): void {
    this.layerVisibility.set(layerId, true);
    this.changeCallbacks.forEach(cb => cb('add', layerId));
  }

  /**
   * Notify that a layer was removed.
   * Call this from MapLibreRenderer when a Zarr layer is removed.
   */
  notifyLayerRemoved(layerId: string): void {
    this.layerVisibility.delete(layerId);
    this.changeCallbacks.forEach(cb => cb('remove', layerId));
  }

  /**
   * Subscribe to layer changes.
   */
  onLayerChange(callback: (event: 'add' | 'remove', layerId: string) => void): () => void {
    this.changeCallbacks.push(callback);
    return () => {
      const idx = this.changeCallbacks.indexOf(callback);
      if (idx >= 0) {
        this.changeCallbacks.splice(idx, 1);
      }
    };
  }
}
