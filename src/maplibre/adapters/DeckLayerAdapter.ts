/**
 * Deck.gl Layer Adapter for integrating Arc and PointCloud layers with the layer control.
 */

import type { CustomLayerAdapter, LayerState } from 'maplibre-gl-layer-control';
import type { MapboxOverlay } from '@deck.gl/mapbox';
import type { Map as MapLibreMap } from 'maplibre-gl';

/**
 * Adapter for deck.gl Arc and PointCloud layers.
 * Allows the layer control to manage these deck.gl layer types.
 */
export class DeckLayerAdapter implements CustomLayerAdapter {
  readonly type = 'deck';

  private map: MapLibreMap;
  private deckOverlay: MapboxOverlay;
  private deckLayers: globalThis.Map<string, unknown>;
  private changeCallbacks: Array<(event: 'add' | 'remove', layerId: string) => void> = [];

  constructor(map: MapLibreMap, deckOverlay: MapboxOverlay, deckLayers: globalThis.Map<string, unknown>) {
    this.map = map;
    this.deckOverlay = deckOverlay;
    this.deckLayers = deckLayers;
  }

  /**
   * Get all deck.gl layer IDs managed by this adapter (arc and pointcloud).
   */
  getLayerIds(): string[] {
    return Array.from(this.deckLayers.keys()).filter(id =>
      id.startsWith('arc-') || id.startsWith('pointcloud-')
    );
  }

  /**
   * Get the state of a deck.gl layer.
   */
  getLayerState(layerId: string): LayerState | null {
    const layer = this.deckLayers.get(layerId) as { props?: { visible?: boolean; opacity?: number } } | undefined;
    if (!layer || !layer.props) return null;

    return {
      visible: layer.props.visible !== false,
      opacity: layer.props.opacity ?? 1,
      name: this.getName(layerId),
    };
  }

  /**
   * Set visibility of a deck.gl layer.
   */
  setVisibility(layerId: string, visible: boolean): void {
    const layer = this.deckLayers.get(layerId) as { clone?: (props: Record<string, unknown>) => unknown } | undefined;
    if (!layer || typeof layer.clone !== 'function') return;

    // Clone the layer with updated visible prop
    const updatedLayer = layer.clone({ visible });
    this.deckLayers.set(layerId, updatedLayer);
    this.updateOverlay();
  }

  /**
   * Set opacity of a deck.gl layer.
   */
  setOpacity(layerId: string, opacity: number): void {
    const layer = this.deckLayers.get(layerId) as { clone?: (props: Record<string, unknown>) => unknown } | undefined;
    if (!layer || typeof layer.clone !== 'function') return;

    // deck.gl layers are immutable; clone to update opacity
    const updatedLayer = layer.clone({ opacity });
    this.deckLayers.set(layerId, updatedLayer);
    this.updateOverlay();
  }

  /**
   * Get the display name for a deck.gl layer.
   */
  getName(layerId: string): string {
    // Convert layer ID to a friendly name
    return layerId
      .replace(/^(arc|pointcloud)[-_]/, '')
      .replace(/[-_]/g, ' ')
      .replace(/\b\w/g, c => c.toUpperCase()) || layerId;
  }

  /**
   * Get the symbol type for deck.gl layers.
   */
  getSymbolType(): string {
    return 'deck';
  }

  /**
   * Notify that a layer was added.
   * Call this from MapLibreRenderer when an Arc or PointCloud layer is added.
   */
  notifyLayerAdded(layerId: string): void {
    this.changeCallbacks.forEach(cb => cb('add', layerId));
  }

  /**
   * Notify that a layer was removed.
   * Call this from MapLibreRenderer when an Arc or PointCloud layer is removed.
   */
  notifyLayerRemoved(layerId: string): void {
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

  private updateOverlay(): void {
    const layers = Array.from(this.deckLayers.values()) as Parameters<typeof this.deckOverlay.setProps>[0]['layers'];
    this.deckOverlay.setProps({ layers });
    this.map.triggerRepaint();
  }
}
