/**
 * State manager for tracking layers, sources, and controls.
 */

import type { MapWidgetModel, LayerState, SourceState, ControlState } from '../types/anywidget';
import type { LayerConfig, SourceConfig } from '../types/maplibre';

/**
 * Manages map state for persistence across cells and HTML export.
 */
export class StateManager {
  private model: MapWidgetModel;

  constructor(model: MapWidgetModel) {
    this.model = model;
  }

  /**
   * Add a layer to the state.
   */
  addLayer(layerId: string, config: LayerConfig): void {
    const layers = this.model.get('_layers') || {};
    const layerState: LayerState = {
      id: config.id,
      type: config.type,
      source: config.source,
      paint: config.paint,
      layout: config.layout,
      visible: true,
      opacity: 1,
    };
    this.model.set('_layers', { ...layers, [layerId]: layerState });
    this.model.save_changes();
  }

  /**
   * Remove a layer from the state.
   */
  removeLayer(layerId: string): void {
    const layers = { ...this.model.get('_layers') };
    delete layers[layerId];
    this.model.set('_layers', layers);
    this.model.save_changes();
  }

  /**
   * Update layer visibility.
   */
  setLayerVisibility(layerId: string, visible: boolean): void {
    const layers = { ...this.model.get('_layers') };
    if (layers[layerId]) {
      layers[layerId] = { ...layers[layerId], visible };
      this.model.set('_layers', layers);
      this.model.save_changes();
    }
  }

  /**
   * Update layer opacity.
   */
  setLayerOpacity(layerId: string, opacity: number): void {
    const layers = { ...this.model.get('_layers') };
    if (layers[layerId]) {
      layers[layerId] = { ...layers[layerId], opacity };
      this.model.set('_layers', layers);
      this.model.save_changes();
    }
  }

  /**
   * Get layer state.
   */
  getLayer(layerId: string): LayerState | undefined {
    return this.model.get('_layers')?.[layerId];
  }

  /**
   * Get all layers.
   */
  getLayers(): Record<string, LayerState> {
    return this.model.get('_layers') || {};
  }

  /**
   * Add a source to the state.
   */
  addSource(sourceId: string, config: SourceConfig): void {
    const sources = this.model.get('_sources') || {};
    const sourceState: SourceState = {
      type: config.type,
      data: config.data,
      url: config.url,
      tiles: config.tiles,
      tileSize: config.tileSize,
      attribution: config.attribution,
    };
    this.model.set('_sources', { ...sources, [sourceId]: sourceState });
    this.model.save_changes();
  }

  /**
   * Remove a source from the state.
   */
  removeSource(sourceId: string): void {
    const sources = { ...this.model.get('_sources') };
    delete sources[sourceId];
    this.model.set('_sources', sources);
    this.model.save_changes();
  }

  /**
   * Get source state.
   */
  getSource(sourceId: string): SourceState | undefined {
    return this.model.get('_sources')?.[sourceId];
  }

  /**
   * Get all sources.
   */
  getSources(): Record<string, SourceState> {
    return this.model.get('_sources') || {};
  }

  /**
   * Add a control to the state.
   */
  addControl(controlId: string, type: string, position: string, options?: Record<string, unknown>): void {
    const controls = this.model.get('_controls') || {};
    const controlState: ControlState = {
      type,
      position,
      options,
    };
    this.model.set('_controls', { ...controls, [controlId]: controlState });
    this.model.save_changes();
  }

  /**
   * Remove a control from the state.
   */
  removeControl(controlId: string): void {
    const controls = { ...this.model.get('_controls') };
    delete controls[controlId];
    this.model.set('_controls', controls);
    this.model.save_changes();
  }

  /**
   * Get control state.
   */
  getControl(controlId: string): ControlState | undefined {
    return this.model.get('_controls')?.[controlId];
  }

  /**
   * Get all controls.
   */
  getControls(): Record<string, ControlState> {
    return this.model.get('_controls') || {};
  }
}
