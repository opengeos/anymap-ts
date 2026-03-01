/**
 * COG Layer Adapter for integrating deck.gl COG layers with the layer control.
 */

import type { CustomLayerAdapter, LayerState } from 'maplibre-gl-layer-control';
import type { MapboxOverlay } from '@deck.gl/mapbox';
import type { Map as MapLibreMap } from 'maplibre-gl';

/**
 * Adapter for COG (Cloud Optimized GeoTIFF) layers.
 * Allows the layer control to manage deck.gl COG layers.
 */
export class COGLayerAdapter implements CustomLayerAdapter {
  readonly type = 'cog';

  private map: MapLibreMap;
  private deckOverlay: MapboxOverlay;
  private deckLayers: globalThis.Map<string, unknown>;
  private changeCallbacks: Array<(event: 'add' | 'remove', layerId: string) => void> = [];

  // Sentinel layer ID used as ordering anchor for deck.gl layers in interleaved mode.
  // Must match the value in MapLibreRenderer.
  private static readonly DECK_SENTINEL_ID = '__deck-overlay-anchor';

  constructor(map: MapLibreMap, deckOverlay: MapboxOverlay, deckLayers: globalThis.Map<string, unknown>) {
    this.map = map;
    this.deckOverlay = deckOverlay;
    this.deckLayers = deckLayers;
  }

  /**
   * Get all COG layer IDs.
   */
  getLayerIds(): string[] {
    return Array.from(this.deckLayers.keys());
  }

  /**
   * Get the state of a COG layer.
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
   * Set visibility of a COG layer.
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
   * Set opacity of a COG layer.
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
   * Get the display name for a COG layer.
   */
  getName(layerId: string): string {
    // Convert layer ID to a friendly name
    return layerId
      .replace(/^cog[-_]/, '')
      .replace(/[-_]/g, ' ')
      .replace(/\b\w/g, c => c.toUpperCase());
  }

  /**
   * Get the symbol type for COG layers.
   */
  getSymbolType(): string {
    return 'cog';
  }

  /**
   * Notify that a layer was added.
   * Call this from MapLibreRenderer when a COG layer is added.
   */
  notifyLayerAdded(layerId: string): void {
    this.changeCallbacks.forEach(cb => cb('add', layerId));
  }

  /**
   * Notify that a layer was removed.
   * Call this from MapLibreRenderer when a COG layer is removed.
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
    const sentinelId = COGLayerAdapter.DECK_SENTINEL_ID;
    const hasSentinel = this.map.getLayer(sentinelId);

    // Inject beforeId on deck.gl layers that don't have one
    // This ensures proper z-ordering with native MapLibre layers in interleaved mode
    if (hasSentinel) {
      for (const [id, layer] of this.deckLayers) {
        const typedLayer = layer as { clone?: (props: Record<string, unknown>) => unknown; props?: { beforeId?: string } };
        if (typedLayer.clone && !typedLayer.props?.beforeId) {
          this.deckLayers.set(id, typedLayer.clone({ beforeId: sentinelId }));
        }
      }
    }

    const layers = Array.from(this.deckLayers.values());
    this.deckOverlay.setProps({ layers: layers as any });
    this.map.triggerRepaint();
  }
}
