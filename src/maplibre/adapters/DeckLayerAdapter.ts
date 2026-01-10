/**
 * Deck.gl Layer Adapter for integrating all deck.gl layers with the layer control.
 */

import type { CustomLayerAdapter, LayerState } from 'maplibre-gl-layer-control';
import type { MapboxOverlay } from '@deck.gl/mapbox';
import type { Map as MapLibreMap } from 'maplibre-gl';

/**
 * Adapter for all deck.gl layer types.
 * Allows the layer control to manage deck.gl layers including:
 * ScatterplotLayer, ArcLayer, PathLayer, PolygonLayer, HexagonLayer,
 * HeatmapLayer, GridLayer, IconLayer, TextLayer, GeoJsonLayer,
 * ContourLayer, ScreenGridLayer, PointCloudLayer, TripsLayer, LineLayer.
 */
export class DeckLayerAdapter implements CustomLayerAdapter {
  readonly type = 'deck';

  /**
   * All supported deck.gl layer prefixes for layer control integration.
   */
  private static readonly LAYER_PREFIXES = [
    'scatterplot-',
    'arc-',
    'path-',
    'polygon-',
    'hexagon-',
    'heatmap-',
    'grid-',
    'icon-',
    'text-',
    'geojson-',
    'contour-',
    'screengrid-',
    'pointcloud-',
    'trips-',
    'line-',
    'cog-',
  ];

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
   * Get all deck.gl layer IDs managed by this adapter.
   */
  getLayerIds(): string[] {
    return Array.from(this.deckLayers.keys()).filter(id =>
      DeckLayerAdapter.LAYER_PREFIXES.some(prefix => id.startsWith(prefix))
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
    // Try to extract a meaningful name from the layer ID
    for (const prefix of DeckLayerAdapter.LAYER_PREFIXES) {
      if (layerId.startsWith(prefix)) {
        const remainder = layerId.slice(prefix.length);
        // If remainder is just a number, use the layer type as name
        if (!remainder || /^\d+$/.test(remainder)) {
          const layerType = prefix.slice(0, -1); // Remove trailing dash
          return layerType.charAt(0).toUpperCase() + layerType.slice(1) + ' Layer';
        }
        // Otherwise, format the remainder as a name
        return remainder
          .replace(/[-_]/g, ' ')
          .replace(/\b\w/g, c => c.toUpperCase());
      }
    }
    return layerId;
  }

  /**
   * Get the symbol type for deck.gl layers based on layer type.
   */
  getSymbolType(layerId: string): string {
    // Point-based layers
    if (layerId.startsWith('scatterplot-') || layerId.startsWith('pointcloud-') ||
        layerId.startsWith('icon-')) {
      return 'circle';
    }
    // Line-based layers
    if (layerId.startsWith('arc-') || layerId.startsWith('line-') ||
        layerId.startsWith('path-') || layerId.startsWith('trips-')) {
      return 'line';
    }
    // Fill-based layers
    if (layerId.startsWith('polygon-') || layerId.startsWith('hexagon-') ||
        layerId.startsWith('grid-') || layerId.startsWith('geojson-')) {
      return 'fill';
    }
    // Heatmap/density layers
    if (layerId.startsWith('heatmap-') || layerId.startsWith('screengrid-') ||
        layerId.startsWith('contour-')) {
      return 'heatmap';
    }
    // Text layers
    if (layerId.startsWith('text-')) {
      return 'symbol';
    }
    // Raster layers
    if (layerId.startsWith('cog-')) {
      return 'raster';
    }
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
