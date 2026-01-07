/**
 * MapLibre GL JS renderer implementation.
 */

import maplibregl, {
  Map as MapLibreMap,
  NavigationControl,
  ScaleControl,
  FullscreenControl,
  GeolocateControl,
  AttributionControl,
  Marker,
  Popup,
  GlobeControl,
} from 'maplibre-gl';
import { BaseMapRenderer, MethodHandler } from '../core/BaseMapRenderer';
import { StateManager } from '../core/StateManager';
import type { MapWidgetModel } from '../types/anywidget';
import type {
  LayerConfig,
  SourceConfig,
  ControlPosition,
  FlyToOptions,
  FitBoundsOptions,
  DEFAULT_PAINT,
  inferLayerType,
} from '../types/maplibre';
import type { Feature, FeatureCollection } from 'geojson';

import { GeoEditorPlugin } from './plugins/GeoEditorPlugin';
import { LayerControlPlugin } from './plugins/LayerControlPlugin';

/**
 * MapLibre GL JS map renderer.
 */
export class MapLibreRenderer extends BaseMapRenderer<MapLibreMap> {
  private stateManager: StateManager;
  private markersMap: globalThis.Map<string, Marker> = new globalThis.Map();
  private popupsMap: globalThis.Map<string, Popup> = new globalThis.Map();
  private controlsMap: globalThis.Map<string, maplibregl.IControl> = new globalThis.Map();
  private geoEditorPlugin: GeoEditorPlugin | null = null;
  private layerControlPlugin: LayerControlPlugin | null = null;
  private resizeObserver: ResizeObserver | null = null;

  constructor(model: MapWidgetModel, el: HTMLElement) {
    super(model, el);
    this.stateManager = new StateManager(model);
    this.registerMethods();
  }

  /**
   * Initialize the MapLibre map.
   */
  async initialize(): Promise<void> {
    // Create container
    this.createMapContainer();

    // Create map
    this.map = this.createMap();

    // Set up listeners
    this.setupModelListeners();
    this.setupMapEvents();

    // Set up resize observer to handle container size changes
    this.setupResizeObserver();

    // Process any JS calls that were made before listeners were set up
    // These will be queued in pendingCalls since map isn't ready yet
    this.processJsCalls();

    // Wait for map to load
    await new Promise<void>((resolve) => {
      this.map!.on('load', () => {
        this.isMapReady = true;
        // Process any calls that were queued while waiting for map to load
        this.processPendingCalls();
        // Force resize after load to ensure correct dimensions
        setTimeout(() => {
          if (this.map) {
            this.map.resize();
          }
        }, 100);
        resolve();
      });
    });
  }

  /**
   * Set up resize observer to handle container size changes.
   */
  private setupResizeObserver(): void {
    if (!this.mapContainer || !this.map) return;

    this.resizeObserver = new ResizeObserver(() => {
      if (this.map) {
        this.map.resize();
      }
    });

    this.resizeObserver.observe(this.mapContainer);
    // Also observe the parent element
    this.resizeObserver.observe(this.el);
  }

  /**
   * Create the MapLibre map instance.
   */
  protected createMap(): MapLibreMap {
    const style = this.model.get('style');
    const center = this.model.get('center');
    const zoom = this.model.get('zoom');
    const bearing = this.model.get('bearing') || 0;
    const pitch = this.model.get('pitch') || 0;

    return new MapLibreMap({
      container: this.mapContainer!,
      style: typeof style === 'string' ? style : (style as maplibregl.StyleSpecification),
      center: center as [number, number],
      zoom,
      bearing,
      pitch,
      attributionControl: false,
    });
  }

  /**
   * Set up map event listeners.
   */
  private setupMapEvents(): void {
    if (!this.map) return;

    // Click event
    this.map.on('click', (e) => {
      this.model.set('clicked', {
        lng: e.lngLat.lng,
        lat: e.lngLat.lat,
        point: [e.point.x, e.point.y],
      });
      this.sendEvent('click', {
        lngLat: [e.lngLat.lng, e.lngLat.lat],
        point: [e.point.x, e.point.y],
      });
      this.model.save_changes();
    });

    // Move end event
    this.map.on('moveend', () => {
      if (!this.map) return;
      const center = this.map.getCenter();
      const bounds = this.map.getBounds();
      const zoom = this.map.getZoom();

      this.model.set('current_center', [center.lng, center.lat]);
      this.model.set('current_zoom', zoom);
      this.model.set('current_bounds', [
        bounds.getWest(),
        bounds.getSouth(),
        bounds.getEast(),
        bounds.getNorth(),
      ]);
      this.model.save_changes();

      this.sendEvent('moveend', {
        center: [center.lng, center.lat],
        zoom,
        bounds: [
          bounds.getWest(),
          bounds.getSouth(),
          bounds.getEast(),
          bounds.getNorth(),
        ],
      });
    });

    // Zoom end event
    this.map.on('zoomend', () => {
      if (!this.map) return;
      this.sendEvent('zoomend', { zoom: this.map.getZoom() });
    });
  }

  /**
   * Register all method handlers.
   */
  private registerMethods(): void {
    // Map navigation
    this.registerMethod('setCenter', this.handleSetCenter.bind(this));
    this.registerMethod('setZoom', this.handleSetZoom.bind(this));
    this.registerMethod('flyTo', this.handleFlyTo.bind(this));
    this.registerMethod('fitBounds', this.handleFitBounds.bind(this));

    // Sources
    this.registerMethod('addSource', this.handleAddSource.bind(this));
    this.registerMethod('removeSource', this.handleRemoveSource.bind(this));

    // Layers
    this.registerMethod('addLayer', this.handleAddLayer.bind(this));
    this.registerMethod('removeLayer', this.handleRemoveLayer.bind(this));
    this.registerMethod('setVisibility', this.handleSetVisibility.bind(this));
    this.registerMethod('setOpacity', this.handleSetOpacity.bind(this));
    this.registerMethod('setPaintProperty', this.handleSetPaintProperty.bind(this));
    this.registerMethod('setLayoutProperty', this.handleSetLayoutProperty.bind(this));

    // Basemaps
    this.registerMethod('addBasemap', this.handleAddBasemap.bind(this));

    // Vector data
    this.registerMethod('addGeoJSON', this.handleAddGeoJSON.bind(this));

    // Raster data
    this.registerMethod('addTileLayer', this.handleAddTileLayer.bind(this));

    // Controls
    this.registerMethod('addControl', this.handleAddControl.bind(this));
    this.registerMethod('removeControl', this.handleRemoveControl.bind(this));
    this.registerMethod('addLayerControl', this.handleAddLayerControl.bind(this));

    // Draw control
    this.registerMethod('addDrawControl', this.handleAddDrawControl.bind(this));
    this.registerMethod('getDrawData', this.handleGetDrawData.bind(this));
    this.registerMethod('loadDrawData', this.handleLoadDrawData.bind(this));
    this.registerMethod('clearDrawData', this.handleClearDrawData.bind(this));

    // Markers and popups
    this.registerMethod('addMarker', this.handleAddMarker.bind(this));
    this.registerMethod('removeMarker', this.handleRemoveMarker.bind(this));
  }

  // -------------------------------------------------------------------------
  // Map navigation handlers
  // -------------------------------------------------------------------------

  private handleSetCenter(args: unknown[], kwargs: Record<string, unknown>): void {
    if (!this.map) return;
    const [lng, lat] = args as [number, number];
    this.map.setCenter([lng, lat]);
  }

  private handleSetZoom(args: unknown[], kwargs: Record<string, unknown>): void {
    if (!this.map) return;
    const [zoom] = args as [number];
    this.map.setZoom(zoom);
  }

  private handleFlyTo(args: unknown[], kwargs: Record<string, unknown>): void {
    if (!this.map) return;
    const [lng, lat] = args as [number, number];
    const options: FlyToOptions = {
      center: [lng, lat],
      zoom: kwargs.zoom as number | undefined,
      bearing: kwargs.bearing as number | undefined,
      pitch: kwargs.pitch as number | undefined,
      duration: (kwargs.duration as number) || 2000,
    };
    this.map.flyTo(options);
  }

  private handleFitBounds(args: unknown[], kwargs: Record<string, unknown>): void {
    if (!this.map) return;
    const [bounds] = args as [[number, number, number, number]];
    const options: FitBoundsOptions = {
      padding: (kwargs.padding as number) || 50,
      duration: (kwargs.duration as number) || 1000,
      maxZoom: kwargs.maxZoom as number | undefined,
    };
    this.map.fitBounds(
      [
        [bounds[0], bounds[1]],
        [bounds[2], bounds[3]],
      ],
      options
    );
  }

  // -------------------------------------------------------------------------
  // Source handlers
  // -------------------------------------------------------------------------

  private handleAddSource(args: unknown[], kwargs: Record<string, unknown>): void {
    if (!this.map) return;
    const [sourceId] = args as [string];
    const config = kwargs as SourceConfig;

    if (this.map.getSource(sourceId)) {
      console.warn(`Source ${sourceId} already exists`);
      return;
    }

    this.map.addSource(sourceId, config as maplibregl.SourceSpecification);
    this.stateManager.addSource(sourceId, config);
  }

  private handleRemoveSource(args: unknown[], kwargs: Record<string, unknown>): void {
    if (!this.map) return;
    const [sourceId] = args as [string];

    if (!this.map.getSource(sourceId)) {
      return;
    }

    this.map.removeSource(sourceId);
    this.stateManager.removeSource(sourceId);
  }

  // -------------------------------------------------------------------------
  // Layer handlers
  // -------------------------------------------------------------------------

  private handleAddLayer(args: unknown[], kwargs: Record<string, unknown>): void {
    if (!this.map) return;
    const config = kwargs as LayerConfig;

    if (this.map.getLayer(config.id)) {
      console.warn(`Layer ${config.id} already exists`);
      return;
    }

    const beforeId = kwargs.beforeId as string | undefined;
    this.map.addLayer(config as maplibregl.LayerSpecification, beforeId);
    this.stateManager.addLayer(config.id, config);
  }

  private handleRemoveLayer(args: unknown[], kwargs: Record<string, unknown>): void {
    if (!this.map) return;
    const [layerId] = args as [string];

    if (!this.map.getLayer(layerId)) {
      return;
    }

    this.map.removeLayer(layerId);
    this.stateManager.removeLayer(layerId);
  }

  private handleSetVisibility(args: unknown[], kwargs: Record<string, unknown>): void {
    if (!this.map) return;
    const [layerId, visible] = args as [string, boolean];

    if (!this.map.getLayer(layerId)) {
      return;
    }

    this.map.setLayoutProperty(layerId, 'visibility', visible ? 'visible' : 'none');
    this.stateManager.setLayerVisibility(layerId, visible);
  }

  private handleSetOpacity(args: unknown[], kwargs: Record<string, unknown>): void {
    if (!this.map) return;
    const [layerId, opacity] = args as [string, number];

    if (!this.map.getLayer(layerId)) {
      return;
    }

    const layer = this.map.getLayer(layerId);
    if (!layer) return;

    // Set opacity based on layer type
    const type = layer.type;
    const opacityProperty = this.getOpacityProperty(type);
    if (opacityProperty) {
      this.map.setPaintProperty(layerId, opacityProperty, opacity);
    }
    this.stateManager.setLayerOpacity(layerId, opacity);
  }

  private getOpacityProperty(layerType: string): string | null {
    const opacityMap: Record<string, string> = {
      fill: 'fill-opacity',
      line: 'line-opacity',
      circle: 'circle-opacity',
      symbol: 'icon-opacity',
      raster: 'raster-opacity',
      'fill-extrusion': 'fill-extrusion-opacity',
      heatmap: 'heatmap-opacity',
    };
    return opacityMap[layerType] || null;
  }

  private handleSetPaintProperty(args: unknown[], kwargs: Record<string, unknown>): void {
    if (!this.map) return;
    const [layerId, property, value] = args as [string, string, unknown];

    if (!this.map.getLayer(layerId)) {
      return;
    }

    this.map.setPaintProperty(layerId, property, value);
  }

  private handleSetLayoutProperty(args: unknown[], kwargs: Record<string, unknown>): void {
    if (!this.map) return;
    const [layerId, property, value] = args as [string, string, unknown];

    if (!this.map.getLayer(layerId)) {
      return;
    }

    this.map.setLayoutProperty(layerId, property, value);
  }

  // -------------------------------------------------------------------------
  // Basemap handlers
  // -------------------------------------------------------------------------

  private handleAddBasemap(args: unknown[], kwargs: Record<string, unknown>): void {
    if (!this.map) return;
    const [url] = args as [string];
    const name = (kwargs.name as string) || 'basemap';
    const attribution = (kwargs.attribution as string) || '';

    const sourceId = `basemap-${name}`;
    const layerId = `basemap-${name}`;

    // Add source if not exists
    if (!this.map.getSource(sourceId)) {
      this.map.addSource(sourceId, {
        type: 'raster',
        tiles: [url],
        tileSize: 256,
        attribution,
      });
    }

    // Add layer at bottom (before first layer or first symbol layer)
    if (!this.map.getLayer(layerId)) {
      const layers = this.map.getStyle().layers || [];
      const firstSymbolId = layers.find((l) => l.type === 'symbol')?.id;

      this.map.addLayer(
        {
          id: layerId,
          type: 'raster',
          source: sourceId,
        },
        firstSymbolId
      );
    }
  }

  // -------------------------------------------------------------------------
  // Vector data handlers
  // -------------------------------------------------------------------------

  private handleAddGeoJSON(args: unknown[], kwargs: Record<string, unknown>): void {
    if (!this.map) return;

    const geojson = kwargs.data as FeatureCollection | Feature;
    const name = kwargs.name as string;
    const layerType = kwargs.layerType as string;
    const paint = kwargs.paint as Record<string, unknown> | undefined;
    const fitBounds = kwargs.fitBounds !== false;

    const sourceId = `${name}-source`;
    const layerId = name;

    // Add source
    if (!this.map.getSource(sourceId)) {
      this.map.addSource(sourceId, {
        type: 'geojson',
        data: geojson,
      });
    }

    // Determine layer type from geometry if not specified
    let type = layerType;
    if (!type && geojson.type === 'FeatureCollection' && geojson.features.length > 0) {
      const geometry = geojson.features[0].geometry;
      type = this.inferLayerType(geometry.type);
    } else if (!type && geojson.type === 'Feature') {
      type = this.inferLayerType(geojson.geometry.type);
    }
    type = type || 'circle';

    // Get default paint if not provided
    const defaultPaint = this.getDefaultPaint(type);
    const layerPaint = paint || defaultPaint;

    // Add layer
    if (!this.map.getLayer(layerId)) {
      this.map.addLayer({
        id: layerId,
        type: type as maplibregl.LayerSpecification['type'],
        source: sourceId,
        paint: layerPaint,
      });
    }

    // Fit bounds
    if (fitBounds && kwargs.bounds) {
      const bounds = kwargs.bounds as [number, number, number, number];
      this.map.fitBounds(
        [
          [bounds[0], bounds[1]],
          [bounds[2], bounds[3]],
        ],
        { padding: 50 }
      );
    }
  }

  private inferLayerType(geometryType: string): string {
    switch (geometryType) {
      case 'Point':
      case 'MultiPoint':
        return 'circle';
      case 'LineString':
      case 'MultiLineString':
        return 'line';
      case 'Polygon':
      case 'MultiPolygon':
        return 'fill';
      default:
        return 'circle';
    }
  }

  private getDefaultPaint(layerType: string): Record<string, unknown> {
    const defaults: Record<string, Record<string, unknown>> = {
      circle: {
        'circle-radius': 5,
        'circle-color': '#3388ff',
        'circle-opacity': 0.8,
        'circle-stroke-width': 1,
        'circle-stroke-color': '#ffffff',
      },
      line: {
        'line-color': '#3388ff',
        'line-width': 2,
        'line-opacity': 0.8,
      },
      fill: {
        'fill-color': '#3388ff',
        'fill-opacity': 0.5,
        'fill-outline-color': '#0000ff',
      },
      raster: {
        'raster-opacity': 1,
      },
    };
    return defaults[layerType] || {};
  }

  // -------------------------------------------------------------------------
  // Raster data handlers
  // -------------------------------------------------------------------------

  private handleAddTileLayer(args: unknown[], kwargs: Record<string, unknown>): void {
    if (!this.map) return;
    const [url] = args as [string];
    const name = (kwargs.name as string) || `tiles-${Date.now()}`;
    const attribution = (kwargs.attribution as string) || '';
    const minZoom = (kwargs.minZoom as number) || 0;
    const maxZoom = (kwargs.maxZoom as number) || 22;

    const sourceId = `${name}-source`;
    const layerId = name;

    // Add source
    if (!this.map.getSource(sourceId)) {
      this.map.addSource(sourceId, {
        type: 'raster',
        tiles: [url],
        tileSize: 256,
        attribution,
        minzoom: minZoom,
        maxzoom: maxZoom,
      });
    }

    // Add layer
    if (!this.map.getLayer(layerId)) {
      this.map.addLayer({
        id: layerId,
        type: 'raster',
        source: sourceId,
        minzoom: minZoom,
        maxzoom: maxZoom,
      });
    }
  }

  // -------------------------------------------------------------------------
  // Control handlers
  // -------------------------------------------------------------------------

  private handleAddControl(args: unknown[], kwargs: Record<string, unknown>): void {
    if (!this.map) return;
    const [controlType] = args as [string];
    const position = (kwargs.position as ControlPosition) || 'top-right';

    let control: maplibregl.IControl | null = null;

    switch (controlType) {
      case 'navigation':
        control = new NavigationControl({
          showCompass: kwargs.showCompass !== false,
          showZoom: kwargs.showZoom !== false,
          visualizePitch: kwargs.visualizePitch !== false,
        });
        break;
      case 'scale':
        control = new ScaleControl({
          maxWidth: (kwargs.maxWidth as number) || 100,
          unit: (kwargs.unit as 'imperial' | 'metric' | 'nautical') || 'metric',
        });
        break;
      case 'fullscreen':
        control = new FullscreenControl();
        break;
      case 'geolocate':
        control = new GeolocateControl({
          positionOptions: { enableHighAccuracy: true },
          trackUserLocation: kwargs.trackUserLocation !== false,
        });
        break;
      case 'attribution':
        control = new AttributionControl({
          compact: kwargs.compact !== false,
        });
        break;
      case 'globe':
        control = new GlobeControl();
        break;
    }

    if (control) {
      this.map.addControl(control, position);
      this.controlsMap.set(controlType, control);
      this.stateManager.addControl(controlType, controlType, position, kwargs);
    }
  }

  private handleRemoveControl(args: unknown[], kwargs: Record<string, unknown>): void {
    if (!this.map) return;
    const [controlType] = args as [string];

    const control = this.controlsMap.get(controlType);
    if (control) {
      this.map.removeControl(control);
      this.controlsMap.delete(controlType);
      this.stateManager.removeControl(controlType);
    }
  }

  private handleAddLayerControl(args: unknown[], kwargs: Record<string, unknown>): void {
    if (!this.map) return;

    const layers = kwargs.layers as string[] | undefined;
    const position = (kwargs.position as ControlPosition) || 'top-right';
    const collapsed = (kwargs.collapsed as boolean) || false;

    // Initialize plugin if not already
    if (!this.layerControlPlugin) {
      this.layerControlPlugin = new LayerControlPlugin(this.map);
    }

    this.layerControlPlugin.initialize({
      layers,
      position,
      collapsed,
    });

    this.stateManager.addControl('layer-control', 'layer-control', position, kwargs);
  }

  // -------------------------------------------------------------------------
  // Draw control handlers
  // -------------------------------------------------------------------------

  private handleAddDrawControl(args: unknown[], kwargs: Record<string, unknown>): void {
    if (!this.map) return;

    const position = (kwargs.position as ControlPosition) || 'top-right';
    const drawModes = kwargs.drawModes as string[] | undefined;
    const editModes = kwargs.editModes as string[] | undefined;
    const collapsed = (kwargs.collapsed as boolean) || false;

    // Initialize plugin if not already
    if (!this.geoEditorPlugin) {
      this.geoEditorPlugin = new GeoEditorPlugin(this.map);
    }

    this.geoEditorPlugin.initialize(
      {
        position,
        drawModes,
        editModes,
        collapsed,
      },
      (data: FeatureCollection) => {
        // Sync draw data to Python
        this.model.set('_draw_data', data);
        this.model.save_changes();
      }
    );

    this.stateManager.addControl('draw-control', 'draw-control', position, kwargs);
  }

  private handleGetDrawData(args: unknown[], kwargs: Record<string, unknown>): void {
    if (!this.geoEditorPlugin) {
      this.model.set('_draw_data', { type: 'FeatureCollection', features: [] });
      this.model.save_changes();
      return;
    }

    const data = this.geoEditorPlugin.getFeatures();
    this.model.set('_draw_data', data);
    this.model.save_changes();
  }

  private handleLoadDrawData(args: unknown[], kwargs: Record<string, unknown>): void {
    if (!this.geoEditorPlugin) {
      console.warn('Draw control not initialized');
      return;
    }

    const geojson = args[0] as FeatureCollection;
    this.geoEditorPlugin.loadFeatures(geojson);
  }

  private handleClearDrawData(args: unknown[], kwargs: Record<string, unknown>): void {
    if (!this.geoEditorPlugin) {
      return;
    }

    this.geoEditorPlugin.clear();
    this.model.set('_draw_data', { type: 'FeatureCollection', features: [] });
    this.model.save_changes();
  }

  // -------------------------------------------------------------------------
  // Marker handlers
  // -------------------------------------------------------------------------

  private handleAddMarker(args: unknown[], kwargs: Record<string, unknown>): void {
    if (!this.map) return;
    const [lng, lat] = args as [number, number];
    const id = (kwargs.id as string) || `marker-${Date.now()}`;
    const color = (kwargs.color as string) || '#3388ff';
    const popup = kwargs.popup as string | undefined;

    const marker = new Marker({ color }).setLngLat([lng, lat]);

    if (popup) {
      marker.setPopup(new Popup().setHTML(popup));
    }

    marker.addTo(this.map);
    this.markersMap.set(id, marker);
  }

  private handleRemoveMarker(args: unknown[], kwargs: Record<string, unknown>): void {
    const [id] = args as [string];
    const marker = this.markersMap.get(id);
    if (marker) {
      marker.remove();
      this.markersMap.delete(id);
    }
  }

  // -------------------------------------------------------------------------
  // Trait change handlers
  // -------------------------------------------------------------------------

  protected onCenterChange(): void {
    if (this.map && this.isMapReady) {
      const center = this.model.get('center');
      this.map.setCenter(center as [number, number]);
    }
  }

  protected onZoomChange(): void {
    if (this.map && this.isMapReady) {
      const zoom = this.model.get('zoom');
      this.map.setZoom(zoom);
    }
  }

  protected onStyleChange(): void {
    if (this.map && this.isMapReady) {
      const style = this.model.get('style');
      this.map.setStyle(typeof style === 'string' ? style : (style as maplibregl.StyleSpecification));
    }
  }

  // -------------------------------------------------------------------------
  // Cleanup
  // -------------------------------------------------------------------------

  destroy(): void {
    // Remove model listeners
    this.removeModelListeners();

    // Disconnect resize observer
    if (this.resizeObserver) {
      this.resizeObserver.disconnect();
      this.resizeObserver = null;
    }

    // Destroy plugins
    if (this.geoEditorPlugin) {
      this.geoEditorPlugin.destroy();
      this.geoEditorPlugin = null;
    }
    if (this.layerControlPlugin) {
      this.layerControlPlugin.destroy();
      this.layerControlPlugin = null;
    }

    // Remove markers
    this.markersMap.forEach((marker) => marker.remove());
    this.markersMap.clear();

    // Remove popups
    this.popupsMap.forEach((popup) => popup.remove());
    this.popupsMap.clear();

    // Remove controls
    this.controlsMap.forEach((control) => {
      if (this.map) {
        this.map.removeControl(control);
      }
    });
    this.controlsMap.clear();

    // Remove map
    if (this.map) {
      this.map.remove();
      this.map = null;
    }

    // Remove container
    if (this.mapContainer) {
      this.mapContainer.remove();
      this.mapContainer = null;
    }
  }
}
