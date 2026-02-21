/**
 * Marker Layer Adapter for integrating DOM markers with the layer control.
 */

import type { Marker } from 'maplibre-gl';
import type { CustomLayerAdapter, LayerState } from 'maplibre-gl-layer-control';

const MARKERS_LAYER_ID = 'Markers';

/**
 * Adapter for MapLibre GL markers (DOM elements).
 * Exposes all markers as a single "Markers" group in the layer control.
 */
export class MarkerLayerAdapter implements CustomLayerAdapter {
  readonly type = 'marker';

  private markersMap: globalThis.Map<string, Marker>;
  private visible = true;
  private opacity = 1;
  private changeCallbacks: Array<(event: 'add' | 'remove', layerId: string) => void> = [];

  constructor(markersMap: globalThis.Map<string, Marker>) {
    this.markersMap = markersMap;
  }

  getLayerIds(): string[] {
    if (this.markersMap.size === 0) return [];
    return [MARKERS_LAYER_ID];
  }

  getLayerState(layerId: string): LayerState | null {
    if (layerId !== MARKERS_LAYER_ID || this.markersMap.size === 0) return null;
    return {
      visible: this.visible,
      opacity: this.opacity,
      name: MARKERS_LAYER_ID,
    };
  }

  setVisibility(layerId: string, visible: boolean): void {
    if (layerId !== MARKERS_LAYER_ID) return;
    this.visible = visible;
    const display = visible ? '' : 'none';
    for (const marker of this.markersMap.values()) {
      marker.getElement().style.display = display;
    }
  }

  setOpacity(layerId: string, opacity: number): void {
    if (layerId !== MARKERS_LAYER_ID) return;
    this.opacity = opacity;
    for (const marker of this.markersMap.values()) {
      marker.getElement().style.opacity = String(opacity);
    }
  }

  getName(): string {
    return MARKERS_LAYER_ID;
  }

  getSymbolType(): string {
    return 'symbol';
  }

  notifyLayerAdded(layerId: string): void {
    for (const cb of this.changeCallbacks) {
      cb('add', layerId);
    }
  }

  notifyLayerRemoved(layerId: string): void {
    for (const cb of this.changeCallbacks) {
      cb('remove', layerId);
    }
  }

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
