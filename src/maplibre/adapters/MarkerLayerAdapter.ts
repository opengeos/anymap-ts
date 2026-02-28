/**
 * Marker Layer Adapter for integrating MapLibre Markers with the layer control.
 */

import type { CustomLayerAdapter, LayerState } from 'maplibre-gl-layer-control';
import type { Map as MapLibreMap, Marker } from 'maplibre-gl';

/**
 * Adapter for DOM-based MapLibre Markers.
 * Allows the layer control to manage marker groups (visibility, opacity, removal).
 */
export class MarkerLayerAdapter implements CustomLayerAdapter {
  readonly type = 'marker';

  private map: MapLibreMap;
  private markerGroups: globalThis.Map<string, Marker[]> = new globalThis.Map();
  private groupNames: globalThis.Map<string, string> = new globalThis.Map();
  private groupVisibility: globalThis.Map<string, boolean> = new globalThis.Map();
  private groupOpacity: globalThis.Map<string, number> = new globalThis.Map();
  private changeCallbacks: Array<(event: 'add' | 'remove', layerId: string) => void> = [];

  constructor(map: MapLibreMap) {
    this.map = map;
  }

  /**
   * Get all marker group IDs.
   */
  getLayerIds(): string[] {
    return Array.from(this.markerGroups.keys());
  }

  /**
   * Get the state of a marker group.
   */
  getLayerState(layerId: string): LayerState | null {
    if (!this.markerGroups.has(layerId)) return null;

    return {
      visible: this.groupVisibility.get(layerId) ?? true,
      opacity: this.groupOpacity.get(layerId) ?? 1,
      name: this.getName(layerId),
    };
  }

  /**
   * Set visibility of a marker group.
   */
  setVisibility(layerId: string, visible: boolean): void {
    const markers = this.markerGroups.get(layerId);
    if (!markers) return;

    this.groupVisibility.set(layerId, visible);
    for (const marker of markers) {
      if (visible) {
        marker.addTo(this.map);
        const opacity = this.groupOpacity.get(layerId) ?? 1;
        marker.getElement().style.opacity = String(opacity);
      } else {
        marker.remove();
      }
    }
  }

  /**
   * Set opacity of a marker group.
   */
  setOpacity(layerId: string, opacity: number): void {
    const markers = this.markerGroups.get(layerId);
    if (!markers) return;

    this.groupOpacity.set(layerId, opacity);
    const visible = this.groupVisibility.get(layerId) ?? true;
    if (visible) {
      for (const marker of markers) {
        marker.getElement().style.opacity = String(opacity);
      }
    }
  }

  /**
   * Get the display name for a marker group.
   */
  getName(layerId: string): string {
    const name = this.groupNames.get(layerId);
    if (name && name !== layerId) return name;
    if (layerId.startsWith('markers-')) {
      const num = parseInt(layerId.slice('markers-'.length), 10);
      return isNaN(num) ? layerId : `Markers ${num + 1}`;
    }
    if (layerId.startsWith('marker-')) {
      const num = parseInt(layerId.slice('marker-'.length), 10);
      return isNaN(num) ? layerId : `Marker ${num + 1}`;
    }
    return layerId;
  }

  /**
   * Get the symbol type for marker groups.
   */
  getSymbolType(): string {
    return 'circle';
  }

  /**
   * Register a marker group.
   */
  addMarkerGroup(groupId: string, name: string, markers: Marker[]): void {
    this.markerGroups.set(groupId, markers);
    this.groupNames.set(groupId, name);
    this.groupVisibility.set(groupId, true);
    this.groupOpacity.set(groupId, 1);
    this.notifyLayerAdded(groupId);
  }

  /**
   * Unregister and remove a marker group.
   */
  removeMarkerGroup(groupId: string): void {
    const markers = this.markerGroups.get(groupId);
    if (markers) {
      for (const marker of markers) {
        marker.remove();
      }
    }
    this.markerGroups.delete(groupId);
    this.groupNames.delete(groupId);
    this.groupVisibility.delete(groupId);
    this.groupOpacity.delete(groupId);
    this.notifyLayerRemoved(groupId);
  }

  /**
   * Remove layer via layer control context menu.
   */
  removeLayer(layerId: string): void {
    this.removeMarkerGroup(layerId);
  }

  /**
   * Notify that a layer was added.
   */
  notifyLayerAdded(layerId: string): void {
    this.changeCallbacks.forEach(cb => cb('add', layerId));
  }

  /**
   * Notify that a layer was removed.
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
}
