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
import { MapboxOverlay } from '@deck.gl/mapbox';
import {
  ArcLayer,
  PointCloudLayer,
  ScatterplotLayer,
  PathLayer,
  PolygonLayer,
  IconLayer,
  TextLayer,
  GeoJsonLayer,
  LineLayer,
} from '@deck.gl/layers';
import {
  HexagonLayer,
  HeatmapLayer,
  GridLayer,
  ContourLayer,
  ScreenGridLayer,
} from '@deck.gl/aggregation-layers';
import { TripsLayer } from '@deck.gl/geo-layers';
import { proj } from '@developmentseed/deck.gl-geotiff';
import { COGLayerWithOpacity as COGLayer } from './layers/COGLayerWithOpacity';
import { toProj4 } from 'geotiff-geokeys-to-proj4';
import { ZarrLayer } from '@carbonplan/zarr-layer';
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
import { COGLayerAdapter, ZarrLayerAdapter, DeckLayerAdapter } from './adapters';

/**
 * Parse GeoKeys to proj4 definition for COG reprojection.
 */
async function geoKeysParser(
  geoKeys: Record<string, unknown>,
): Promise<proj.ProjectionInfo> {
  const projDefinition = toProj4(geoKeys as Parameters<typeof toProj4>[0]);

  return {
    def: projDefinition.proj4,
    parsed: proj.parseCrs(projDefinition.proj4),
    coordinatesUnits: projDefinition.coordinatesUnits as proj.SupportedCrsUnit,
  };
}

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

  // Deck.gl overlay for COG layers
  protected deckOverlay: MapboxOverlay | null = null;
  protected deckLayers: globalThis.Map<string, unknown> = new globalThis.Map();

  // Zarr layers
  protected zarrLayers: globalThis.Map<string, ZarrLayer> = new globalThis.Map();

  // Layer control adapters
  private cogAdapter: COGLayerAdapter | null = null;
  private zarrAdapter: ZarrLayerAdapter | null = null;
  private deckLayerAdapter: DeckLayerAdapter | null = null;

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

    // COG layers (deck.gl)
    this.registerMethod('addCOGLayer', this.handleAddCOGLayer.bind(this));
    this.registerMethod('removeCOGLayer', this.handleRemoveCOGLayer.bind(this));

    // Zarr layers (@carbonplan/zarr-layer)
    this.registerMethod('addZarrLayer', this.handleAddZarrLayer.bind(this));
    this.registerMethod('removeZarrLayer', this.handleRemoveZarrLayer.bind(this));
    this.registerMethod('updateZarrLayer', this.handleUpdateZarrLayer.bind(this));

    // Arc layers (deck.gl)
    this.registerMethod('addArcLayer', this.handleAddArcLayer.bind(this));
    this.registerMethod('removeArcLayer', this.handleRemoveArcLayer.bind(this));

    // PointCloud layers (deck.gl)
    this.registerMethod('addPointCloudLayer', this.handleAddPointCloudLayer.bind(this));
    this.registerMethod('removePointCloudLayer', this.handleRemovePointCloudLayer.bind(this));

    // Additional deck.gl layers
    this.registerMethod('addScatterplotLayer', this.handleAddScatterplotLayer.bind(this));
    this.registerMethod('addPathLayer', this.handleAddPathLayer.bind(this));
    this.registerMethod('addPolygonLayer', this.handleAddPolygonLayer.bind(this));
    this.registerMethod('addHexagonLayer', this.handleAddHexagonLayer.bind(this));
    this.registerMethod('addHeatmapLayer', this.handleAddHeatmapLayer.bind(this));
    this.registerMethod('addGridLayer', this.handleAddGridLayer.bind(this));
    this.registerMethod('addIconLayer', this.handleAddIconLayer.bind(this));
    this.registerMethod('addTextLayer', this.handleAddTextLayer.bind(this));
    this.registerMethod('addGeoJsonLayer', this.handleAddGeoJsonLayer.bind(this));
    this.registerMethod('addContourLayer', this.handleAddContourLayer.bind(this));
    this.registerMethod('addScreenGridLayer', this.handleAddScreenGridLayer.bind(this));
    this.registerMethod('addTripsLayer', this.handleAddTripsLayer.bind(this));
    this.registerMethod('addLineLayer', this.handleAddLineLayer.bind(this));
    this.registerMethod('addDeckGLLayer', this.handleAddDeckGLLayer.bind(this));
    this.registerMethod('removeDeckLayer', this.handleRemoveDeckLayer.bind(this));
    this.registerMethod('setDeckLayerVisibility', this.handleSetDeckLayerVisibility.bind(this));
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

    // Create custom layer adapters for deck.gl and Zarr layers
    const customLayerAdapters = [];

    // Always initialize deck overlay so COG adapter can be created
    // This ensures layer control works regardless of whether COG layers are added before or after
    this.initializeDeckOverlay();

    // Create COG adapter (deck overlay now always exists)
    if (this.deckOverlay && this.map) {
      this.cogAdapter = new COGLayerAdapter(this.map, this.deckOverlay, this.deckLayers);
      customLayerAdapters.push(this.cogAdapter);
    }

    // Create Zarr adapter if there are Zarr layers or map exists
    if (this.map) {
      this.zarrAdapter = new ZarrLayerAdapter(this.map, this.zarrLayers);
      customLayerAdapters.push(this.zarrAdapter);
    }

    // Create Deck layer adapter for Arc and PointCloud layers
    if (this.deckOverlay && this.map) {
      this.deckLayerAdapter = new DeckLayerAdapter(this.map, this.deckOverlay, this.deckLayers);
      customLayerAdapters.push(this.deckLayerAdapter);
    }

    // Initialize plugin if not already
    if (!this.layerControlPlugin) {
      this.layerControlPlugin = new LayerControlPlugin(this.map);
    }

    this.layerControlPlugin.initialize({
      layers,
      position,
      collapsed,
      customLayerAdapters: customLayerAdapters.length > 0 ? customLayerAdapters : undefined,
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
  // COG layer handlers (deck.gl)
  // -------------------------------------------------------------------------

  /**
   * Initialize deck.gl overlay if not already created.
   */
  protected initializeDeckOverlay(): void {
    if (this.deckOverlay || !this.map) return;

    this.deckOverlay = new MapboxOverlay({
      layers: [],
    });
    this.map.addControl(this.deckOverlay as unknown as maplibregl.IControl);
  }

  /**
   * Update deck.gl overlay with current layers.
   */
  protected updateDeckOverlay(): void {
    if (this.deckOverlay) {
      const layers = Array.from(this.deckLayers.values());
      this.deckOverlay.setProps({ layers });
    }
  }

  private handleAddCOGLayer(args: unknown[], kwargs: Record<string, unknown>): void {
    if (!this.map) return;

    // Initialize deck.gl overlay if needed
    this.initializeDeckOverlay();

    const id = kwargs.id as string || `cog-${Date.now()}`;
    const geotiff = kwargs.geotiff as string;
    const fitBounds = kwargs.fitBounds !== false;

    const layer = new COGLayer({
      id,
      geotiff,
      opacity: kwargs.opacity as number ?? 1,
      visible: kwargs.visible !== false,
      debug: kwargs.debug as boolean ?? false,
      debugOpacity: kwargs.debugOpacity as number ?? 0.25,
      maxError: kwargs.maxError as number ?? 0.125,
      beforeId: kwargs.beforeId as string | undefined,
      geoKeysParser,
      onGeoTIFFLoad: (tiff: unknown, options: { geographicBounds: { west: number; south: number; east: number; north: number } }) => {
        if (fitBounds && this.map) {
          const { west, south, east, north } = options.geographicBounds;
          this.map.fitBounds(
            [[west, south], [east, north]],
            { padding: 40, duration: 1000 }
          );
        }
      },
    });

    this.deckLayers.set(id, layer);
    this.updateDeckOverlay();

    // Notify adapter if it exists
    if (this.cogAdapter) {
      this.cogAdapter.notifyLayerAdded(id);
    }
  }

  private handleRemoveCOGLayer(args: unknown[], kwargs: Record<string, unknown>): void {
    const [id] = args as [string];

    // Notify adapter before removal
    if (this.cogAdapter) {
      this.cogAdapter.notifyLayerRemoved(id);
    }

    this.deckLayers.delete(id);
    this.updateDeckOverlay();
  }

  // -------------------------------------------------------------------------
  // Zarr layer handlers (@carbonplan/zarr-layer)
  // -------------------------------------------------------------------------

  private handleAddZarrLayer(args: unknown[], kwargs: Record<string, unknown>): void {
    if (!this.map) return;

    const id = kwargs.id as string || `zarr-${Date.now()}`;
    const source = kwargs.source as string;
    const variable = kwargs.variable as string;
    const clim = kwargs.clim as [number, number] || [0, 100];
    const colormap = kwargs.colormap as string[] || ['#000000', '#ffffff'];
    const selector = kwargs.selector as Record<string, unknown> || {};
    const opacity = kwargs.opacity as number ?? 1;

    const layer = new ZarrLayer({
      id,
      source,
      variable,
      clim,
      colormap,
      selector,
      opacity,
      minzoom: kwargs.minzoom as number,
      maxzoom: kwargs.maxzoom as number,
      fillValue: kwargs.fillValue as number,
      spatialDimensions: kwargs.spatialDimensions as { lat?: string; lon?: string },
      zarrVersion: kwargs.zarrVersion as 2 | 3 | undefined,
      bounds: kwargs.bounds as [number, number, number, number] | undefined,
    });

    this.map.addLayer(layer as unknown as maplibregl.CustomLayerInterface);
    this.zarrLayers.set(id, layer);

    // Notify adapter if it exists
    if (this.zarrAdapter) {
      this.zarrAdapter.notifyLayerAdded(id);
    }
  }

  private handleRemoveZarrLayer(args: unknown[], kwargs: Record<string, unknown>): void {
    const [id] = args as [string];

    // Notify adapter before removal
    if (this.zarrAdapter) {
      this.zarrAdapter.notifyLayerRemoved(id);
    }

    if (this.map && this.map.getLayer(id)) {
      this.map.removeLayer(id);
    }
    this.zarrLayers.delete(id);
  }

  private handleUpdateZarrLayer(args: unknown[], kwargs: Record<string, unknown>): void {
    const id = kwargs.id as string;
    const layer = this.zarrLayers.get(id);
    if (!layer) return;

    // Use the actual ZarrLayer methods
    if (kwargs.selector) layer.setSelector(kwargs.selector as Record<string, number>);
    if (kwargs.clim) layer.setClim(kwargs.clim as [number, number]);
    if (kwargs.colormap) layer.setColormap(kwargs.colormap as string[]);
    if (kwargs.opacity !== undefined) layer.setOpacity(kwargs.opacity as number);
  }

  // -------------------------------------------------------------------------
  // Arc layer handlers (deck.gl)
  // -------------------------------------------------------------------------

  private handleAddArcLayer(args: unknown[], kwargs: Record<string, unknown>): void {
    if (!this.map) return;

    // Initialize deck.gl overlay if needed
    this.initializeDeckOverlay();

    const id = kwargs.id as string || `arc-${Date.now()}`;
    const data = kwargs.data as unknown[];

    // Helper to create accessor from string or use value directly
    const makeAccessor = (value: unknown, defaultProp: string, fallbackFn?: (d: any) => any) => {
      if (typeof value === 'string') {
        return (d: any) => d[value];
      }
      if (typeof value === 'function') {
        return value;
      }
      if (value !== undefined && value !== null) {
        return value; // Return arrays/numbers directly
      }
      return fallbackFn || ((d: any) => d[defaultProp]);
    };

    const layer = new ArcLayer({
      id,
      data,
      pickable: kwargs.pickable !== false,
      opacity: kwargs.opacity as number ?? 0.8,
      getWidth: makeAccessor(kwargs.getWidth ?? kwargs.width, 'width', () => 1),
      getSourcePosition: makeAccessor(kwargs.getSourcePosition, 'source', (d: any) => d.source || d.from || d.sourcePosition),
      getTargetPosition: makeAccessor(kwargs.getTargetPosition, 'target', (d: any) => d.target || d.to || d.targetPosition),
      getSourceColor: makeAccessor(kwargs.getSourceColor ?? kwargs.sourceColor, 'sourceColor', () => [51, 136, 255, 255]),
      getTargetColor: makeAccessor(kwargs.getTargetColor ?? kwargs.targetColor, 'targetColor', () => [255, 136, 51, 255]),
      getHeight: makeAccessor(kwargs.getHeight ?? kwargs.height, 'height', () => 1),
      greatCircle: kwargs.greatCircle as boolean ?? false,
    });

    this.deckLayers.set(id, layer);
    this.updateDeckOverlay();

    // Notify adapter if it exists
    if (this.deckLayerAdapter) {
      this.deckLayerAdapter.notifyLayerAdded(id);
    }
  }

  private handleRemoveArcLayer(args: unknown[], kwargs: Record<string, unknown>): void {
    const [id] = args as [string];

    // Notify adapter before removal
    if (this.deckLayerAdapter) {
      this.deckLayerAdapter.notifyLayerRemoved(id);
    }

    this.deckLayers.delete(id);
    this.updateDeckOverlay();
  }

  // -------------------------------------------------------------------------
  // PointCloud layer handlers (deck.gl)
  // -------------------------------------------------------------------------

  private handleAddPointCloudLayer(args: unknown[], kwargs: Record<string, unknown>): void {
    if (!this.map) return;

    // Initialize deck.gl overlay if needed
    this.initializeDeckOverlay();

    const id = kwargs.id as string || `pointcloud-${Date.now()}`;
    const data = kwargs.data as unknown[];

    // Helper to create accessor from string or use value directly
    const makeAccessor = (value: unknown, defaultProp: string, fallbackFn?: (d: any) => any) => {
      if (typeof value === 'string') {
        return (d: any) => d[value];
      }
      if (typeof value === 'function') {
        return value;
      }
      if (value !== undefined && value !== null) {
        return value; // Return arrays/numbers directly
      }
      return fallbackFn || ((d: any) => d[defaultProp]);
    };

    const layerProps: Record<string, unknown> = {
      id,
      data,
      pickable: kwargs.pickable !== false,
      opacity: kwargs.opacity as number ?? 1,
      pointSize: kwargs.pointSize as number ?? 2,
      getPosition: makeAccessor(kwargs.getPosition, 'position', (d: any) => d.position || d.coordinates || [d.x, d.y, d.z]),
      getNormal: makeAccessor(kwargs.getNormal, 'normal', () => [0, 0, 1]),
      getColor: makeAccessor(kwargs.getColor ?? kwargs.color, 'color', () => [255, 255, 255, 255]),
      sizeUnits: kwargs.sizeUnits as 'pixels' | 'meters' | 'common' ?? 'pixels',
    };

    // Only add coordinate system props if explicitly provided
    if (kwargs.coordinateSystem !== undefined && kwargs.coordinateSystem !== null) {
      layerProps.coordinateSystem = kwargs.coordinateSystem as number;
    }
    if (kwargs.coordinateOrigin !== undefined && kwargs.coordinateOrigin !== null) {
      layerProps.coordinateOrigin = kwargs.coordinateOrigin as [number, number, number];
    }

    const layer = new PointCloudLayer(layerProps);

    this.deckLayers.set(id, layer);
    this.updateDeckOverlay();

    // Notify adapter if it exists
    if (this.deckLayerAdapter) {
      this.deckLayerAdapter.notifyLayerAdded(id);
    }
  }

  private handleRemovePointCloudLayer(args: unknown[], kwargs: Record<string, unknown>): void {
    const [id] = args as [string];

    // Notify adapter before removal
    if (this.deckLayerAdapter) {
      this.deckLayerAdapter.notifyLayerRemoved(id);
    }

    this.deckLayers.delete(id);
    this.updateDeckOverlay();
  }

  // -------------------------------------------------------------------------
  // Additional deck.gl layer handlers
  // -------------------------------------------------------------------------

  private handleAddScatterplotLayer(args: unknown[], kwargs: Record<string, unknown>): void {
    if (!this.map) return;
    this.initializeDeckOverlay();

    const id = kwargs.id as string || `scatterplot-${Date.now()}`;
    const data = kwargs.data as unknown[];

    const layer = new ScatterplotLayer({
      id,
      data,
      pickable: kwargs.pickable !== false,
      opacity: kwargs.opacity as number ?? 0.8,
      stroked: kwargs.stroked !== false,
      filled: kwargs.filled !== false,
      radiusScale: kwargs.radiusScale as number ?? 1,
      radiusMinPixels: kwargs.radiusMinPixels as number ?? 1,
      radiusMaxPixels: kwargs.radiusMaxPixels as number ?? 100,
      lineWidthMinPixels: kwargs.lineWidthMinPixels as number ?? 1,
      getPosition: kwargs.getPosition ?? ((d: any) => d.coordinates || d.position || [d.lng || d.longitude, d.lat || d.latitude]),
      getRadius: kwargs.getRadius ?? kwargs.radius ?? 5,
      getFillColor: kwargs.getFillColor ?? kwargs.fillColor ?? [51, 136, 255, 200],
      getLineColor: kwargs.getLineColor ?? kwargs.lineColor ?? [255, 255, 255, 255],
    });

    this.deckLayers.set(id, layer);
    this.updateDeckOverlay();

    if (this.deckLayerAdapter) {
      this.deckLayerAdapter.notifyLayerAdded(id);
    }
  }

  private handleAddPathLayer(args: unknown[], kwargs: Record<string, unknown>): void {
    if (!this.map) return;
    this.initializeDeckOverlay();

    const id = kwargs.id as string || `path-${Date.now()}`;
    const data = kwargs.data as unknown[];

    const layer = new PathLayer({
      id,
      data,
      pickable: kwargs.pickable !== false,
      opacity: kwargs.opacity as number ?? 0.8,
      widthScale: kwargs.widthScale as number ?? 1,
      widthMinPixels: kwargs.widthMinPixels as number ?? 1,
      getPath: kwargs.getPath ?? ((d: any) => d.path || d.coordinates),
      getColor: kwargs.getColor ?? kwargs.color ?? [51, 136, 255, 200],
      getWidth: kwargs.getWidth ?? kwargs.width ?? 1,
    });

    this.deckLayers.set(id, layer);
    this.updateDeckOverlay();

    if (this.deckLayerAdapter) {
      this.deckLayerAdapter.notifyLayerAdded(id);
    }
  }

  private handleAddPolygonLayer(args: unknown[], kwargs: Record<string, unknown>): void {
    if (!this.map) return;
    this.initializeDeckOverlay();

    const id = kwargs.id as string || `polygon-${Date.now()}`;
    const data = kwargs.data as unknown[];

    const layer = new PolygonLayer({
      id,
      data,
      pickable: kwargs.pickable !== false,
      opacity: kwargs.opacity as number ?? 0.5,
      stroked: kwargs.stroked !== false,
      filled: kwargs.filled !== false,
      extruded: kwargs.extruded as boolean ?? false,
      wireframe: kwargs.wireframe as boolean ?? false,
      lineWidthMinPixels: kwargs.lineWidthMinPixels as number ?? 1,
      getPolygon: kwargs.getPolygon ?? ((d: any) => d.polygon || d.contour || d.coordinates),
      getElevation: kwargs.getElevation ?? kwargs.elevation ?? 0,
      getFillColor: kwargs.getFillColor ?? kwargs.fillColor ?? [51, 136, 255, 128],
      getLineColor: kwargs.getLineColor ?? kwargs.lineColor ?? [0, 0, 255, 255],
      getLineWidth: kwargs.getLineWidth ?? kwargs.lineWidth ?? 1,
    });

    this.deckLayers.set(id, layer);
    this.updateDeckOverlay();

    if (this.deckLayerAdapter) {
      this.deckLayerAdapter.notifyLayerAdded(id);
    }
  }

  private handleAddHexagonLayer(args: unknown[], kwargs: Record<string, unknown>): void {
    if (!this.map) return;
    this.initializeDeckOverlay();

    const id = kwargs.id as string || `hexagon-${Date.now()}`;
    const data = kwargs.data as unknown[];

    const layer = new HexagonLayer({
      id,
      data,
      pickable: kwargs.pickable !== false,
      opacity: kwargs.opacity as number ?? 0.8,
      extruded: kwargs.extruded as boolean ?? true,
      radius: kwargs.radius as number ?? 1000,
      elevationScale: kwargs.elevationScale as number ?? 4,
      getPosition: kwargs.getPosition ?? ((d: any) => d.coordinates || d.position || [d.lng || d.longitude, d.lat || d.latitude]),
      colorRange: kwargs.colorRange as number[][] ?? [
        [1, 152, 189],
        [73, 227, 206],
        [216, 254, 181],
        [254, 237, 177],
        [254, 173, 84],
        [209, 55, 78],
      ],
    });

    this.deckLayers.set(id, layer);
    this.updateDeckOverlay();

    if (this.deckLayerAdapter) {
      this.deckLayerAdapter.notifyLayerAdded(id);
    }
  }

  private handleAddHeatmapLayer(args: unknown[], kwargs: Record<string, unknown>): void {
    if (!this.map) return;
    this.initializeDeckOverlay();

    const id = kwargs.id as string || `heatmap-${Date.now()}`;
    const data = kwargs.data as unknown[];

    const layer = new HeatmapLayer({
      id,
      data,
      pickable: false,
      opacity: kwargs.opacity as number ?? 1,
      radiusPixels: kwargs.radiusPixels as number ?? 30,
      intensity: kwargs.intensity as number ?? 1,
      threshold: kwargs.threshold as number ?? 0.05,
      getPosition: kwargs.getPosition ?? ((d: any) => d.coordinates || d.position || [d.lng || d.longitude, d.lat || d.latitude]),
      getWeight: kwargs.getWeight ?? kwargs.weight ?? 1,
      colorRange: kwargs.colorRange as number[][] ?? [
        [255, 255, 178, 25],
        [254, 217, 118, 85],
        [254, 178, 76, 127],
        [253, 141, 60, 170],
        [240, 59, 32, 212],
        [189, 0, 38, 255],
      ],
    });

    this.deckLayers.set(id, layer);
    this.updateDeckOverlay();

    if (this.deckLayerAdapter) {
      this.deckLayerAdapter.notifyLayerAdded(id);
    }
  }

  private handleAddGridLayer(args: unknown[], kwargs: Record<string, unknown>): void {
    if (!this.map) return;
    this.initializeDeckOverlay();

    const id = kwargs.id as string || `grid-${Date.now()}`;
    const data = kwargs.data as unknown[];

    const layer = new GridLayer({
      id,
      data,
      pickable: kwargs.pickable !== false,
      opacity: kwargs.opacity as number ?? 0.8,
      extruded: kwargs.extruded as boolean ?? true,
      cellSize: kwargs.cellSize as number ?? 200,
      elevationScale: kwargs.elevationScale as number ?? 4,
      getPosition: kwargs.getPosition ?? ((d: any) => d.coordinates || d.position || [d.lng || d.longitude, d.lat || d.latitude]),
      colorRange: kwargs.colorRange as number[][] ?? [
        [1, 152, 189],
        [73, 227, 206],
        [216, 254, 181],
        [254, 237, 177],
        [254, 173, 84],
        [209, 55, 78],
      ],
    });

    this.deckLayers.set(id, layer);
    this.updateDeckOverlay();

    if (this.deckLayerAdapter) {
      this.deckLayerAdapter.notifyLayerAdded(id);
    }
  }

  private handleAddIconLayer(args: unknown[], kwargs: Record<string, unknown>): void {
    if (!this.map) return;
    this.initializeDeckOverlay();

    const id = kwargs.id as string || `icon-${Date.now()}`;
    const data = kwargs.data as unknown[];

    const layer = new IconLayer({
      id,
      data,
      pickable: kwargs.pickable !== false,
      opacity: kwargs.opacity as number ?? 1,
      iconAtlas: kwargs.iconAtlas as string,
      iconMapping: kwargs.iconMapping as Record<string, unknown>,
      getPosition: kwargs.getPosition ?? ((d: any) => d.coordinates || d.position || [d.lng || d.longitude, d.lat || d.latitude]),
      getIcon: kwargs.getIcon ?? ((d: any) => d.icon || 'marker'),
      getSize: kwargs.getSize ?? kwargs.size ?? 20,
      getColor: kwargs.getColor ?? kwargs.color ?? [255, 255, 255, 255],
    });

    this.deckLayers.set(id, layer);
    this.updateDeckOverlay();

    if (this.deckLayerAdapter) {
      this.deckLayerAdapter.notifyLayerAdded(id);
    }
  }

  private handleAddTextLayer(args: unknown[], kwargs: Record<string, unknown>): void {
    if (!this.map) return;
    this.initializeDeckOverlay();

    const id = kwargs.id as string || `text-${Date.now()}`;
    const data = kwargs.data as unknown[];

    const layer = new TextLayer({
      id,
      data,
      pickable: kwargs.pickable !== false,
      opacity: kwargs.opacity as number ?? 1,
      getPosition: kwargs.getPosition ?? ((d: any) => d.coordinates || d.position || [d.lng || d.longitude, d.lat || d.latitude]),
      getText: kwargs.getText ?? ((d: any) => d.text || d.label || d.name || ''),
      getSize: kwargs.getSize ?? kwargs.size ?? 12,
      getColor: kwargs.getColor ?? kwargs.color ?? [0, 0, 0, 255],
      getAngle: kwargs.getAngle ?? 0,
      getTextAnchor: kwargs.getTextAnchor ?? 'middle',
      getAlignmentBaseline: kwargs.getAlignmentBaseline ?? 'center',
    });

    this.deckLayers.set(id, layer);
    this.updateDeckOverlay();

    if (this.deckLayerAdapter) {
      this.deckLayerAdapter.notifyLayerAdded(id);
    }
  }

  private handleAddGeoJsonLayer(args: unknown[], kwargs: Record<string, unknown>): void {
    if (!this.map) return;
    this.initializeDeckOverlay();

    const id = kwargs.id as string || `geojson-${Date.now()}`;
    const data = kwargs.data as unknown;

    const layer = new GeoJsonLayer({
      id,
      data,
      pickable: kwargs.pickable !== false,
      opacity: kwargs.opacity as number ?? 0.8,
      stroked: kwargs.stroked !== false,
      filled: kwargs.filled !== false,
      extruded: kwargs.extruded as boolean ?? false,
      wireframe: kwargs.wireframe as boolean ?? false,
      lineWidthMinPixels: kwargs.lineWidthMinPixels as number ?? 1,
      pointRadiusMinPixels: kwargs.pointRadiusMinPixels as number ?? 2,
      getFillColor: kwargs.getFillColor ?? kwargs.fillColor ?? [51, 136, 255, 128],
      getLineColor: kwargs.getLineColor ?? kwargs.lineColor ?? [0, 0, 0, 255],
      getLineWidth: kwargs.getLineWidth ?? kwargs.lineWidth ?? 1,
      getPointRadius: kwargs.getPointRadius ?? kwargs.pointRadius ?? 5,
      getElevation: kwargs.getElevation ?? kwargs.elevation ?? 0,
    });

    this.deckLayers.set(id, layer);
    this.updateDeckOverlay();

    if (this.deckLayerAdapter) {
      this.deckLayerAdapter.notifyLayerAdded(id);
    }
  }

  private handleAddContourLayer(args: unknown[], kwargs: Record<string, unknown>): void {
    if (!this.map) return;
    this.initializeDeckOverlay();

    const id = kwargs.id as string || `contour-${Date.now()}`;
    const data = kwargs.data as unknown[];

    const layer = new ContourLayer({
      id,
      data,
      pickable: kwargs.pickable !== false,
      opacity: kwargs.opacity as number ?? 1,
      cellSize: kwargs.cellSize as number ?? 200,
      contours: kwargs.contours as any[] ?? [
        { threshold: 1, color: [255, 255, 255], strokeWidth: 1 },
        { threshold: 5, color: [51, 136, 255], strokeWidth: 2 },
        { threshold: 10, color: [0, 0, 255], strokeWidth: 3 },
      ],
      getPosition: kwargs.getPosition ?? ((d: any) => d.coordinates || d.position || [d.lng || d.longitude, d.lat || d.latitude]),
      getWeight: kwargs.getWeight ?? kwargs.weight ?? 1,
    });

    this.deckLayers.set(id, layer);
    this.updateDeckOverlay();

    if (this.deckLayerAdapter) {
      this.deckLayerAdapter.notifyLayerAdded(id);
    }
  }

  private handleAddScreenGridLayer(args: unknown[], kwargs: Record<string, unknown>): void {
    if (!this.map) return;
    this.initializeDeckOverlay();

    const id = kwargs.id as string || `screengrid-${Date.now()}`;
    const data = kwargs.data as unknown[];

    const layer = new ScreenGridLayer({
      id,
      data,
      pickable: kwargs.pickable !== false,
      opacity: kwargs.opacity as number ?? 0.8,
      cellSizePixels: kwargs.cellSizePixels as number ?? 50,
      getPosition: kwargs.getPosition ?? ((d: any) => d.coordinates || d.position || [d.lng || d.longitude, d.lat || d.latitude]),
      getWeight: kwargs.getWeight ?? kwargs.weight ?? 1,
      colorRange: kwargs.colorRange as number[][] ?? [
        [255, 255, 178, 25],
        [254, 217, 118, 85],
        [254, 178, 76, 127],
        [253, 141, 60, 170],
        [240, 59, 32, 212],
        [189, 0, 38, 255],
      ],
    });

    this.deckLayers.set(id, layer);
    this.updateDeckOverlay();

    if (this.deckLayerAdapter) {
      this.deckLayerAdapter.notifyLayerAdded(id);
    }
  }

  private handleAddTripsLayer(args: unknown[], kwargs: Record<string, unknown>): void {
    if (!this.map) return;
    this.initializeDeckOverlay();

    const id = kwargs.id as string || `trips-${Date.now()}`;
    const data = kwargs.data as unknown[];

    // Helper to create accessor from string or use value directly
    const makeAccessor = (value: unknown, defaultProp: string, fallbackFn?: (d: any) => any) => {
      if (typeof value === 'string') {
        return (d: any) => d[value];
      }
      if (typeof value === 'function') {
        return value;
      }
      if (value !== undefined && value !== null) {
        return value;
      }
      return fallbackFn || ((d: any) => d[defaultProp]);
    };

    const layer = new TripsLayer({
      id,
      data,
      pickable: kwargs.pickable !== false,
      opacity: kwargs.opacity as number ?? 0.8,
      widthMinPixels: kwargs.widthMinPixels as number ?? 2,
      trailLength: kwargs.trailLength as number ?? 180,
      currentTime: kwargs.currentTime as number ?? 0,
      getPath: makeAccessor(kwargs.getPath, 'waypoints', (d: any) => d.waypoints || d.path || d.coordinates),
      getTimestamps: makeAccessor(kwargs.getTimestamps, 'timestamps', (d: any) => d.timestamps),
      getColor: makeAccessor(kwargs.getColor ?? kwargs.color, 'color', () => [253, 128, 93]),
    });

    this.deckLayers.set(id, layer);
    this.updateDeckOverlay();

    if (this.deckLayerAdapter) {
      this.deckLayerAdapter.notifyLayerAdded(id);
    }
  }

  private handleAddLineLayer(args: unknown[], kwargs: Record<string, unknown>): void {
    if (!this.map) return;
    this.initializeDeckOverlay();

    const id = kwargs.id as string || `line-${Date.now()}`;
    const data = kwargs.data as unknown[];

    // Helper to create accessor from string or use value directly
    const makeAccessor = (value: unknown, defaultProp: string, fallbackFn?: (d: any) => any) => {
      if (typeof value === 'string') {
        return (d: any) => d[value];
      }
      if (typeof value === 'function') {
        return value;
      }
      if (value !== undefined && value !== null) {
        return value;
      }
      return fallbackFn || ((d: any) => d[defaultProp]);
    };

    const layer = new LineLayer({
      id,
      data,
      pickable: kwargs.pickable !== false,
      opacity: kwargs.opacity as number ?? 0.8,
      widthMinPixels: kwargs.widthMinPixels as number ?? 1,
      getSourcePosition: makeAccessor(kwargs.getSourcePosition, 'sourcePosition', (d: any) => d.sourcePosition || d.source || d.from),
      getTargetPosition: makeAccessor(kwargs.getTargetPosition, 'targetPosition', (d: any) => d.targetPosition || d.target || d.to),
      getColor: makeAccessor(kwargs.getColor ?? kwargs.color, 'color', () => [51, 136, 255, 200]),
      getWidth: makeAccessor(kwargs.getWidth ?? kwargs.width, 'width', () => 1),
    });

    this.deckLayers.set(id, layer);
    this.updateDeckOverlay();

    if (this.deckLayerAdapter) {
      this.deckLayerAdapter.notifyLayerAdded(id);
    }
  }

  /**
   * Generic handler for adding any deck.gl layer type.
   * Routes to specific handlers based on layerType.
   */
  private handleAddDeckGLLayer(args: unknown[], kwargs: Record<string, unknown>): void {
    if (!this.map) return;

    const layerType = kwargs.layerType as string;
    if (!layerType) {
      console.warn('addDeckGLLayer called without layerType');
      return;
    }

    // Map layer types to handler methods
    const handlerMap: Record<string, (args: unknown[], kwargs: Record<string, unknown>) => void> = {
      'ScatterplotLayer': this.handleAddScatterplotLayer.bind(this),
      'ArcLayer': this.handleAddArcLayer.bind(this),
      'PathLayer': this.handleAddPathLayer.bind(this),
      'PolygonLayer': this.handleAddPolygonLayer.bind(this),
      'HexagonLayer': this.handleAddHexagonLayer.bind(this),
      'HeatmapLayer': this.handleAddHeatmapLayer.bind(this),
      'GridLayer': this.handleAddGridLayer.bind(this),
      'IconLayer': this.handleAddIconLayer.bind(this),
      'TextLayer': this.handleAddTextLayer.bind(this),
      'GeoJsonLayer': this.handleAddGeoJsonLayer.bind(this),
      'ContourLayer': this.handleAddContourLayer.bind(this),
      'ScreenGridLayer': this.handleAddScreenGridLayer.bind(this),
      'PointCloudLayer': this.handleAddPointCloudLayer.bind(this),
      'TripsLayer': this.handleAddTripsLayer.bind(this),
      'LineLayer': this.handleAddLineLayer.bind(this),
    };

    const handler = handlerMap[layerType];
    if (handler) {
      handler(args, kwargs);
    } else {
      console.warn(`Unknown deck.gl layer type: ${layerType}`);
    }
  }

  /**
   * Remove a deck.gl layer by ID.
   */
  private handleRemoveDeckLayer(args: unknown[], kwargs: Record<string, unknown>): void {
    const id = (args[0] as string) || (kwargs.id as string);
    if (!id) return;

    if (this.deckLayerAdapter) {
      this.deckLayerAdapter.notifyLayerRemoved(id);
    }

    this.deckLayers.delete(id);
    this.updateDeckOverlay();
  }

  /**
   * Set visibility of a deck.gl layer.
   */
  private handleSetDeckLayerVisibility(args: unknown[], kwargs: Record<string, unknown>): void {
    const id = (args[0] as string) || (kwargs.id as string);
    const visible = (args[1] as boolean) ?? (kwargs.visible as boolean) ?? true;

    if (!id) return;

    const layer = this.deckLayers.get(id) as { clone?: (props: Record<string, unknown>) => unknown } | undefined;
    if (layer && typeof layer.clone === 'function') {
      const updatedLayer = layer.clone({ visible });
      this.deckLayers.set(id, updatedLayer);
      this.updateDeckOverlay();
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

    // Remove deck.gl overlay
    if (this.deckOverlay && this.map) {
      this.map.removeControl(this.deckOverlay as unknown as maplibregl.IControl);
      this.deckOverlay = null;
    }
    this.deckLayers.clear();

    // Remove zarr layers
    this.zarrLayers.forEach((layer, id) => {
      if (this.map && this.map.getLayer(id)) {
        this.map.removeLayer(id);
      }
    });
    this.zarrLayers.clear();

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
