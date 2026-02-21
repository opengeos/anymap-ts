/**
 * MapLibre GL JS renderer implementation.
 * Uses dynamic imports to keep the bundle size small.
 */

import { BaseMapRenderer, MethodHandler } from '../core/BaseMapRenderer';
import { StateManager } from '../core/StateManager';
import type { MapWidgetModel } from '../types/anywidget';
import type {
  LayerConfig,
  SourceConfig,
  ControlPosition,
  FlyToOptions,
  FitBoundsOptions,
} from '../types/maplibre';
import type { Feature, FeatureCollection } from 'geojson';
import type { LidarControlOptions, LidarLayerOptions, LidarColorScheme } from '../types/lidar';

// Import plugins (these are lightweight)
import { GeoEditorPlugin } from './plugins/GeoEditorPlugin';
import { LayerControlPlugin } from './plugins/LayerControlPlugin';
import { COGLayerAdapter, ZarrLayerAdapter, DeckLayerAdapter } from './adapters';

// flatgeobuf is loaded dynamically when needed

// Type imports for CDN-loaded modules
import type * as MaplibreGl from 'maplibre-gl';
import type { MapboxOverlay } from '@deck.gl/mapbox';

// Lazy loader functions for heavy dependencies
async function loadMaplibreComponents() {
  const mod = await import('https://esm.sh/maplibre-gl-components@0.15.0');
  return mod;
}

async function loadMaplibreLidar() {
  const mod = await import('https://esm.sh/maplibre-gl-lidar@0.11.1');
  return mod;
}

async function loadDeckGl() {
  const [layers, aggregationLayers, geoLayers, mapbox] = await Promise.all([
    import('https://esm.sh/@deck.gl/layers@9.2.9'),
    import('https://esm.sh/@deck.gl/aggregation-layers@9.2.9'),
    import('https://esm.sh/@deck.gl/geo-layers@9.2.9'),
    import('https://esm.sh/@deck.gl/mapbox@9.2.9'),
  ]);
  return { layers, aggregationLayers, geoLayers, mapbox };
}

async function loadTurf() {
  const [along, length, helpers] = await Promise.all([
    import('https://esm.sh/@turf/along@7'),
    import('https://esm.sh/@turf/length@7'),
    import('https://esm.sh/@turf/helpers@7'),
  ]);
  return {
    along: along.default,
    length: length.default,
    lineString: helpers.lineString,
  };
}

async function loadZarrLayer() {
  const mod = await import('https://esm.sh/@carbonplan/zarr-layer@0.3.1');
  return mod;
}

async function loadGeotiff() {
  const mod = await import('https://esm.sh/@developmentseed/deck.gl-geotiff@0.2.0');
  return mod;
}

async function loadGeokeysParser() {
  const mod = await import('https://esm.sh/geotiff-geokeys-to-proj4@2024.4.13');
  return mod;
}

/**
 * MapLibre GL JS map renderer.
 */
export class MapLibreRenderer extends BaseMapRenderer<MaplibreGl.Map> {
  private stateManager: StateManager;
  private markersMap: globalThis.Map<string, MaplibreGl.Marker> = new globalThis.Map();
  private popupsMap: globalThis.Map<string, MaplibreGl.Popup> = new globalThis.Map();
  private controlsMap: globalThis.Map<string, MaplibreGl.IControl> = new globalThis.Map();
  private legendsMap: globalThis.Map<string, HTMLElement> = new globalThis.Map();
  private geoEditorPlugin: GeoEditorPlugin | null = null;
  private layerControlPlugin: LayerControlPlugin | null = null;
  private resizeObserver: ResizeObserver | null = null;

  // MapLibre module reference (loaded from CDN)
  private maplibregl: typeof MaplibreGl;

  // Deck.gl overlay for layers
  protected deckOverlay: MapboxOverlay | null = null;
  protected deckLayers: globalThis.Map<string, unknown> = new globalThis.Map();

  // Zarr layers
  protected zarrLayers: globalThis.Map<string, any> = new globalThis.Map();

  // Layer control adapters
  private cogAdapter: COGLayerAdapter | null = null;
  private zarrAdapter: ZarrLayerAdapter | null = null;
  private deckLayerAdapter: DeckLayerAdapter | null = null;
  private lidarAdapter: any | null = null;

  // LiDAR control
  protected lidarControl: any | null = null;
  protected lidarLayers: globalThis.Map<string, string> = new globalThis.Map();

  // maplibre-gl-components controls
  protected pmtilesLayerControl: any | null = null;
  protected cogLayerUiControl: any | null = null;
  protected zarrLayerUiControl: any | null = null;
  protected addVectorControl: any | null = null;
  protected controlGrid: any | null = null;

  // Other controls
  protected colorbarsMap: globalThis.Map<string, any> = new globalThis.Map();
  protected searchControl: any | null = null;
  protected measureControl: any | null = null;
  protected printControl: any | null = null;

  // Route animations
  protected animations: globalThis.Map<string, any> = new globalThis.Map();

  // Feature hover state tracking
  protected hoveredFeatureId: string | number | null = null;
  protected hoveredLayerId: string | null = null;

  // Video sources tracking
  protected videoSources: globalThis.Map<string, string> = new globalThis.Map();

  // Split map state
  private splitMapRight: MaplibreGl.Map | null = null;
  private splitMapContainer: HTMLDivElement | null = null;
  private splitSlider: HTMLDivElement | null = null;
  private splitActive: boolean = false;

  constructor(model: MapWidgetModel, el: HTMLElement, maplibregl: typeof MaplibreGl) {
    super(model, el);
    this.maplibregl = maplibregl;
    this.stateManager = new StateManager(model);
    this.registerMethods();
  }

  /**
   * Initialize the MapLibre map.
   */
  async initialize(): Promise<void> {
    this.createMapContainer();
    this.map = this.createMap();
    this.setupModelListeners();
    this.setupMapEvents();
    this.setupResizeObserver();
    // Note: processJsCalls is now async, but we don't need to await it here
    // as it will be called again when the model changes
    this.processJsCalls().catch(console.error);

    // Wait for map to load
    await new Promise<void>((resolve) => {
      this.map!.on('load', async () => {
        this.isMapReady = true;
        await this.restoreState();
        
        const initProjection = this.model.get('projection') as string;
        if (initProjection && initProjection !== 'mercator') {
          try {
            this.map!.setProjection({ type: initProjection } as MaplibreGl.ProjectionSpecification);
          } catch (err) {
            console.warn('Failed to set initial projection:', err);
          }
        }
        
        await this.processPendingCalls();
        if (this.map) {
          this.map.resize();
        }
        resolve();
      });
    });
  }

  /**
   * Set up resize observer to handle container size changes.
   */
  private resizeDebounceTimer: number | null = null;

  private setupResizeObserver(): void {
    if (!this.mapContainer || !this.map) return;

    this.resizeObserver = new ResizeObserver(() => {
      if (this.map) {
        if (this.resizeDebounceTimer !== null) {
          window.clearTimeout(this.resizeDebounceTimer);
        }
        this.resizeDebounceTimer = window.setTimeout(() => {
          if (this.map) {
            this.map.resize();
          }
          this.resizeDebounceTimer = null;
        }, 100);
      }
    });

    this.resizeObserver.observe(this.mapContainer);
    this.resizeObserver.observe(this.el);
  }

  /**
   * Create the MapLibre map instance.
   */
  protected createMap(): MaplibreGl.Map {
    const style = this.model.get('style');
    const center = this.model.get('center');
    const zoom = this.model.get('zoom');
    const bearing = this.model.get('bearing') || 0;
    const pitch = this.model.get('pitch') || 0;
    const maxPitchValue = this.model.get('max_pitch');
    const maxPitch = typeof maxPitchValue === 'number' ? maxPitchValue : 85;

    return new this.maplibregl.Map({
      container: this.mapContainer!,
      style: typeof style === 'string' ? style : (style as MaplibreGl.StyleSpecification),
      center: center as [number, number],
      zoom,
      bearing,
      pitch,
      maxPitch,
      attributionControl: false,
    });
  }

  /**
   * Set up map event listeners.
   */
  private setupMapEvents(): void {
    if (!this.map) return;

    this.map.on('click', (e: MaplibreGl.MapMouseEvent) => {
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

    this.map.on('moveend', () => {
      if (!this.map) return;
      const center = this.map.getCenter();
      const bounds = this.map.getBounds();
      const zoom = this.map.getZoom();

      if (bounds) {
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
      }
    });

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

    // Sources and layers
    this.registerMethod('addSource', this.handleAddSource.bind(this));
    this.registerMethod('removeSource', this.handleRemoveSource.bind(this));
    this.registerMethod('addLayer', this.handleAddLayer.bind(this));
    this.registerMethod('removeLayer', this.handleRemoveLayer.bind(this));
    this.registerMethod('setVisibility', this.handleSetVisibility.bind(this));
    this.registerMethod('setOpacity', this.handleSetOpacity.bind(this));
    this.registerMethod('setPaintProperty', this.handleSetPaintProperty.bind(this));
    this.registerMethod('setLayoutProperty', this.handleSetLayoutProperty.bind(this));
    this.registerMethod('moveLayer', this.handleMoveLayer.bind(this));

    // Basemaps and data
    this.registerMethod('addBasemap', this.handleAddBasemap.bind(this));
    this.registerMethod('addGeoJSON', this.handleAddGeoJSON.bind(this));
    this.registerMethod('addTileLayer', this.handleAddTileLayer.bind(this));
    this.registerMethod('addImageLayer', this.handleAddImageLayer.bind(this));

    // Controls
    this.registerMethod('addControl', this.handleAddControl.bind(this));
    this.registerMethod('removeControl', this.handleRemoveControl.bind(this));
    this.registerMethod('addLayerControl', this.handleAddLayerControl.bind(this));

    // Markers
    this.registerMethod('addMarker', this.handleAddMarker.bind(this));
    this.registerMethod('addMarkers', this.handleAddMarkers.bind(this));
    this.registerMethod('removeMarker', this.handleRemoveMarker.bind(this));
    this.registerMethod('addPopup', this.handleAddPopup.bind(this));

    // Legend and terrain
    this.registerMethod('addLegend', this.handleAddLegend.bind(this));
    this.registerMethod('removeLegend', this.handleRemoveLegend.bind(this));
    this.registerMethod('addTerrain', this.handleAddTerrain.bind(this));

    // Draw control
    this.registerMethod('addDrawControl', this.handleAddDrawControl.bind(this));
    this.registerMethod('getDrawData', this.handleGetDrawData.bind(this));
    this.registerMethod('loadDrawData', this.handleLoadDrawData.bind(this));
    this.registerMethod('clearDrawData', this.handleClearDrawData.bind(this));

    // Projection and native features
    this.registerMethod('setProjection', this.handleSetProjection.bind(this));
    this.registerMethod('updateGeoJSONSource', this.handleUpdateGeoJSONSource.bind(this));
    this.registerMethod('addMapImage', this.handleAddMapImage.bind(this));

    // Deck.gl layers (async)
    this.registerMethod('addCOGLayer', this.handleAddCOGLayer.bind(this));
    this.registerMethod('removeCOGLayer', this.handleRemoveCOGLayer.bind(this));
    this.registerMethod('addZarrLayer', this.handleAddZarrLayer.bind(this));
    this.registerMethod('removeZarrLayer', this.handleRemoveZarrLayer.bind(this));
    this.registerMethod('updateZarrLayer', this.handleUpdateZarrLayer.bind(this));
    this.registerMethod('addArcLayer', this.handleAddArcLayer.bind(this));
    this.registerMethod('removeArcLayer', this.handleRemoveArcLayer.bind(this));
    this.registerMethod('addPointCloudLayer', this.handleAddPointCloudLayer.bind(this));
    this.registerMethod('removePointCloudLayer', this.handleRemovePointCloudLayer.bind(this));
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
    this.registerMethod('addBitmapLayer', this.handleAddBitmapLayer.bind(this));
    this.registerMethod('addColumnLayer', this.handleAddColumnLayer.bind(this));
    this.registerMethod('addGridCellLayer', this.handleAddGridCellLayer.bind(this));
    this.registerMethod('addSolidPolygonLayer', this.handleAddSolidPolygonLayer.bind(this));
    this.registerMethod('addDeckGLLayer', this.handleAddDeckGLLayer.bind(this));
    this.registerMethod('removeDeckLayer', this.handleRemoveDeckLayer.bind(this));
    this.registerMethod('setDeckLayerVisibility', this.handleSetDeckLayerVisibility.bind(this));

    // UI controls
    this.registerMethod('addTimeSlider', this.handleAddTimeSlider.bind(this));
    this.registerMethod('removeTimeSlider', this.handleRemoveTimeSlider.bind(this));
    this.registerMethod('addSwipeMap', this.handleAddSwipeMap.bind(this));
    this.registerMethod('removeSwipeMap', this.handleRemoveSwipeMap.bind(this));
    this.registerMethod('addOpacitySlider', this.handleAddOpacitySlider.bind(this));
    this.registerMethod('removeOpacitySlider', this.handleRemoveOpacitySlider.bind(this));
    this.registerMethod('addStyleSwitcher', this.handleAddStyleSwitcher.bind(this));
    this.registerMethod('removeStyleSwitcher', this.handleRemoveStyleSwitcher.bind(this));

    // Query and features
    this.registerMethod('getVisibleFeatures', this.handleGetVisibleFeatures.bind(this));
    this.registerMethod('getLayerData', this.handleGetLayerData.bind(this));
    this.registerMethod('queryRenderedFeatures', this.handleQueryRenderedFeatures.bind(this));
    this.registerMethod('querySourceFeatures', this.handleQuerySourceFeatures.bind(this));
    this.registerMethod('setFilter', this.handleSetFilter.bind(this));

    // LiDAR
    this.registerMethod('addLidarControl', this.handleAddLidarControl.bind(this));
    this.registerMethod('addLidarLayer', this.handleAddLidarLayer.bind(this));
    this.registerMethod('removeLidarLayer', this.handleRemoveLidarLayer.bind(this));
    this.registerMethod('setLidarColorScheme', this.handleSetLidarColorScheme.bind(this));
    this.registerMethod('setLidarPointSize', this.handleSetLidarPointSize.bind(this));
    this.registerMethod('setLidarOpacity', this.handleSetLidarOpacity.bind(this));

    // PMTiles
    this.registerMethod('addPMTilesLayer', this.handleAddPMTilesLayer.bind(this));
    this.registerMethod('removePMTilesLayer', this.handleRemovePMTilesLayer.bind(this));
    this.registerMethod('addPMTilesControl', this.handleAddPMTilesControl.bind(this));

    // maplibre-gl-components
    this.registerMethod('addCogControl', this.handleAddCogControl.bind(this));
    this.registerMethod('addZarrControl', this.handleAddZarrControl.bind(this));
    this.registerMethod('addVectorControl', this.handleAddVectorControl.bind(this));
    this.registerMethod('addControlGrid', this.handleAddControlGrid.bind(this));

    // Clustering
    this.registerMethod('addClusterLayer', this.handleAddClusterLayer.bind(this));
    this.registerMethod('removeClusterLayer', this.handleRemoveClusterLayer.bind(this));

    // Choropleth and 3D
    this.registerMethod('addChoropleth', this.handleAddChoropleth.bind(this));
    this.registerMethod('add3DBuildings', this.handleAdd3DBuildings.bind(this));

    // Animation
    this.registerMethod('animateAlongRoute', this.handleAnimateAlongRoute.bind(this));
    this.registerMethod('stopAnimation', this.handleStopAnimation.bind(this));
    this.registerMethod('pauseAnimation', this.handlePauseAnimation.bind(this));
    this.registerMethod('resumeAnimation', this.handleResumeAnimation.bind(this));
    this.registerMethod('setAnimationSpeed', this.handleSetAnimationSpeed.bind(this));

    // Hover and sky
    this.registerMethod('addHoverEffect', this.handleAddHoverEffect.bind(this));
    this.registerMethod('setSky', this.handleSetSky.bind(this));
    this.registerMethod('removeSky', this.handleRemoveSky.bind(this));

    // Video
    this.registerMethod('addVideoLayer', this.handleAddVideoLayer.bind(this));
    this.registerMethod('removeVideoLayer', this.handleRemoveVideoLayer.bind(this));
    this.registerMethod('playVideo', this.handlePlayVideo.bind(this));
    this.registerMethod('pauseVideo', this.handlePauseVideo.bind(this));
    this.registerMethod('seekVideo', this.handleSeekVideo.bind(this));

    // Split map
    this.registerMethod('addSplitMap', this.handleAddSplitMap.bind(this));
    this.registerMethod('removeSplitMap', this.handleRemoveSplitMap.bind(this));

    // Colorbar
    this.registerMethod('addColorbar', this.handleAddColorbar.bind(this));
    this.registerMethod('removeColorbar', this.handleRemoveColorbar.bind(this));
    this.registerMethod('updateColorbar', this.handleUpdateColorbar.bind(this));

    // Search, Measure, Print
    this.registerMethod('addSearchControl', this.handleAddSearchControl.bind(this));
    this.registerMethod('removeSearchControl', this.handleRemoveSearchControl.bind(this));
    this.registerMethod('addMeasureControl', this.handleAddMeasureControl.bind(this));
    this.registerMethod('removeMeasureControl', this.handleRemoveMeasureControl.bind(this));
    this.registerMethod('addPrintControl', this.handleAddPrintControl.bind(this));
    this.registerMethod('removePrintControl', this.handleRemovePrintControl.bind(this));

    // FlatGeobuf
    this.registerMethod('addFlatGeobuf', this.handleAddFlatGeobuf.bind(this));
    this.registerMethod('removeFlatGeobuf', this.handleRemoveFlatGeobuf.bind(this));
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
    const config = kwargs as unknown as SourceConfig;

    if (this.map.getSource(sourceId)) {
      console.warn(`Source ${sourceId} already exists`);
      return;
    }

    this.map.addSource(sourceId, config as MaplibreGl.SourceSpecification);
    this.stateManager.addSource(sourceId, config);
  }

  private handleRemoveSource(args: unknown[], kwargs: Record<string, unknown>): void {
    if (!this.map) return;
    const [sourceId] = args as [string];

    if (!this.map.getSource(sourceId)) return;
    this.map.removeSource(sourceId);
    this.stateManager.removeSource(sourceId);
  }

  // -------------------------------------------------------------------------
  // Layer handlers
  // -------------------------------------------------------------------------

  private handleAddLayer(args: unknown[], kwargs: Record<string, unknown>): void {
    if (!this.map) return;
    const config = kwargs as unknown as LayerConfig;

    if (this.map.getLayer(config.id)) {
      console.warn(`Layer ${config.id} already exists`);
      return;
    }

    const beforeId = kwargs.beforeId as string | undefined;
    this.map.addLayer(config as MaplibreGl.LayerSpecification, beforeId);
    this.stateManager.addLayer(config.id, config);
  }

  private handleRemoveLayer(args: unknown[], kwargs: Record<string, unknown>): void {
    if (!this.map) return;
    const [layerId] = args as [string];

    if (!this.map.getLayer(layerId)) return;
    this.map.removeLayer(layerId);
    this.stateManager.removeLayer(layerId);
  }

  private handleSetVisibility(args: unknown[], kwargs: Record<string, unknown>): void {
    if (!this.map) return;
    const [layerId, visible] = args as [string, boolean];

    if (!this.map.getLayer(layerId)) return;
    this.map.setLayoutProperty(layerId, 'visibility', visible ? 'visible' : 'none');
    this.stateManager.setLayerVisibility(layerId, visible);
  }

  private handleSetOpacity(args: unknown[], kwargs: Record<string, unknown>): void {
    if (!this.map) return;
    const [layerId, opacity] = args as [string, number];

    if (!this.map.getLayer(layerId)) return;

    const layer = this.map.getLayer(layerId);
    if (!layer) return;

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
    if (!this.map.getLayer(layerId)) return;
    this.map.setPaintProperty(layerId, property, value);
  }

  private handleSetLayoutProperty(args: unknown[], kwargs: Record<string, unknown>): void {
    if (!this.map) return;
    const [layerId, property, value] = args as [string, string, unknown];
    if (!this.map.getLayer(layerId)) return;
    this.map.setLayoutProperty(layerId, property, value);
  }

  private handleMoveLayer(args: unknown[], kwargs: Record<string, unknown>): void {
    if (!this.map) return;
    const [layerId, beforeId] = args as [string, string | undefined];
    if (!layerId || !this.map.getLayer(layerId)) return;
    this.map.moveLayer(layerId, beforeId || undefined);
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
    const layerId = `${name}`;

    if (!this.map.getSource(sourceId)) {
      const sourceConfig = {
        type: 'raster' as const,
        tiles: [url],
        tileSize: 256,
        attribution,
      };
      this.map.addSource(sourceId, sourceConfig);
      this.stateManager.addSource(sourceId, sourceConfig as unknown as SourceConfig);
    }

    if (!this.map.getLayer(layerId)) {
      const layers = this.map.getStyle().layers || [];
      const firstSymbolId = layers.find((l) => l.type === 'symbol')?.id;

      const layerConfig = {
        id: layerId,
        type: 'raster' as const,
        source: sourceId,
      };
      this.map.addLayer(layerConfig, firstSymbolId);
      this.stateManager.addLayer(layerId, layerConfig as unknown as LayerConfig);
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

    let type = layerType;
    if (!type && (geojson as FeatureCollection).type === 'FeatureCollection' && (geojson as FeatureCollection).features.length > 0) {
      const geometry = (geojson as FeatureCollection).features[0].geometry;
      type = this.inferLayerType(geometry.type);
    } else if (!type && (geojson as Feature).type === 'Feature') {
      type = this.inferLayerType((geojson as Feature).geometry.type);
    }
    type = type || 'circle';

    const defaultPaint = this.getDefaultPaint(type);
    const layerPaint = paint || defaultPaint;

    if (!this.map.getSource(sourceId)) {
      const sourceConfig = {
        type: 'geojson' as const,
        data: geojson,
      };
      this.map.addSource(sourceId, sourceConfig);
      this.stateManager.addSource(sourceId, sourceConfig as unknown as SourceConfig);
    }

    if (!this.map.getLayer(layerId)) {
      const layerConfig = {
        id: layerId,
        type: type as MaplibreGl.LayerSpecification['type'],
        source: sourceId,
        paint: layerPaint,
      };
      this.map.addLayer(layerConfig as MaplibreGl.AddLayerObject);
      this.stateManager.addLayer(layerId, layerConfig as unknown as LayerConfig);
    }

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

    if (!this.map.getSource(sourceId)) {
      const sourceConfig = {
        type: 'raster' as const,
        tiles: [url],
        tileSize: 256,
        attribution,
        minzoom: minZoom,
        maxzoom: maxZoom,
      };
      this.map.addSource(sourceId, sourceConfig);
      this.stateManager.addSource(sourceId, sourceConfig as unknown as SourceConfig);
    }

    if (!this.map.getLayer(layerId)) {
      const layerConfig = {
        id: layerId,
        type: 'raster' as const,
        source: sourceId,
        minzoom: minZoom,
        maxzoom: maxZoom,
      };
      this.map.addLayer(layerConfig);
      this.stateManager.addLayer(layerId, layerConfig as unknown as LayerConfig);
    }
  }

  private handleAddImageLayer(args: unknown[], kwargs: Record<string, unknown>): void {
    if (!this.map) return;
    const id = (kwargs.id as string) || `image-${Date.now()}`;
    const url = kwargs.url as string;
    const coordinates = kwargs.coordinates as number[][];
    const opacity = (kwargs.opacity as number) ?? 1.0;

    if (!url || !coordinates || coordinates.length !== 4) {
      console.error('addImageLayer requires url and 4 corner coordinates');
      return;
    }

    const sourceId = `${id}-source`;

    if (!this.map.getSource(sourceId)) {
      this.map.addSource(sourceId, {
        type: 'image',
        url: url,
        coordinates: coordinates as [[number, number], [number, number], [number, number], [number, number]],
      });
    }

    if (!this.map.getLayer(id)) {
      this.map.addLayer({
        id: id,
        type: 'raster',
        source: sourceId,
        paint: {
          'raster-opacity': opacity,
        },
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

    let control: MaplibreGl.IControl | null = null;

    switch (controlType) {
      case 'navigation':
        control = new this.maplibregl.NavigationControl({
          showCompass: kwargs.showCompass !== false,
          showZoom: kwargs.showZoom !== false,
          visualizePitch: kwargs.visualizePitch !== false,
        });
        break;
      case 'scale':
        control = new this.maplibregl.ScaleControl({
          maxWidth: (kwargs.maxWidth as number) || 100,
          unit: (kwargs.unit as 'imperial' | 'metric' | 'nautical') || 'metric',
        });
        break;
      case 'fullscreen':
        control = new this.maplibregl.FullscreenControl();
        break;
      case 'geolocate':
        control = new this.maplibregl.GeolocateControl({
          positionOptions: { enableHighAccuracy: true },
          trackUserLocation: kwargs.trackUserLocation !== false,
        });
        break;
      case 'attribution':
        control = new this.maplibregl.AttributionControl({
          compact: kwargs.compact !== false,
        });
        break;
      case 'globe':
        control = new this.maplibregl.GlobeControl();
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

  private async handleAddLayerControl(args: unknown[], kwargs: Record<string, unknown>): Promise<void> {
    if (!this.map) return;

    let layers = kwargs.layers as string[] | undefined;
    if (!layers || layers.length === 0) {
      const modelLayers = this.model.get('_layers') || {};
      const layerIds = Object.keys(modelLayers);
      if (layerIds.length > 0) {
        layers = layerIds;
      }
    }
    const position = (kwargs.position as ControlPosition) || 'top-right';
    const collapsed = (kwargs.collapsed as boolean) || false;
    const defaultExclude = [
      'measure-*',
      'mapbox-gl-draw-*',
      'gl-draw-*',
      'gm_*',
      'inspect-highlight-*',
      'lidar-*',
      'usgs-lidar-*',
    ];
    const excludeLayers = (kwargs.excludeLayers as string[] | undefined) ?? defaultExclude;

    const customLayerAdapters = [];

    await this.initializeDeckOverlay();

    if (this.deckOverlay && this.map) {
      this.cogAdapter = new COGLayerAdapter(this.map, this.deckOverlay, this.deckLayers);
      customLayerAdapters.push(this.cogAdapter);
    }

    if (this.map) {
      this.zarrAdapter = new ZarrLayerAdapter(this.map, this.zarrLayers);
      customLayerAdapters.push(this.zarrAdapter);
    }

    if (this.deckOverlay && this.map) {
      this.deckLayerAdapter = new DeckLayerAdapter(this.map, this.deckOverlay, this.deckLayers);
      customLayerAdapters.push(this.deckLayerAdapter);
    }

    if (this.lidarControl) {
      const { LidarLayerAdapter } = await loadMaplibreLidar();
      this.lidarAdapter = new LidarLayerAdapter(this.lidarControl);
      customLayerAdapters.push(this.lidarAdapter);
    }

    if (!this.layerControlPlugin) {
      this.layerControlPlugin = new LayerControlPlugin(this.map);
    }

    await this.layerControlPlugin.initialize({
      layers,
      position,
      collapsed,
      customLayerAdapters: customLayerAdapters.length > 0 ? customLayerAdapters : undefined,
      excludeLayers,
    });

    this.stateManager.addControl('layer-control', 'layer-control', position, kwargs);
  }

  // -------------------------------------------------------------------------
  // Marker handlers
  // -------------------------------------------------------------------------

  private wrapWithContrastStyle(content: string): string {
    return `<div style="color: #333; background: #fff; margin: -10px -10px -15px; padding: 6px 10px 10px;">${content}</div>`;
  }

  private handleAddMarker(args: unknown[], kwargs: Record<string, unknown>): void {
    if (!this.map) return;
    const [lng, lat] = args as [number, number];
    const id = (kwargs.id as string) || `marker-${Date.now()}`;
    const color = (kwargs.color as string) || '#3388ff';
    const popup = kwargs.popup as string | undefined;
    const tooltip = kwargs.tooltip as string | undefined;
    const scale = (kwargs.scale as number) ?? 1.0;
    const popupMaxWidth = (kwargs.popupMaxWidth as string) || '240px';
    const tooltipMaxWidth = (kwargs.tooltipMaxWidth as string) || '240px';
    const draggable = (kwargs.draggable as boolean) || false;

    const marker = new this.maplibregl.Marker({ color, scale, draggable }).setLngLat([lng, lat]);

    if (popup) {
      marker.setPopup(new this.maplibregl.Popup({ maxWidth: popupMaxWidth }).setHTML(this.wrapWithContrastStyle(popup)));
    }

    if (tooltip) {
      const tooltipPopup = new this.maplibregl.Popup({
        closeButton: false,
        closeOnClick: false,
        maxWidth: tooltipMaxWidth,
        offset: [0, -30 * scale],
        anchor: 'bottom',
      });
      tooltipPopup.setHTML(this.wrapWithContrastStyle(tooltip));

      const markerElement = marker.getElement();
      let isHovering = false;

      markerElement.addEventListener('mouseenter', () => {
        isHovering = true;
        tooltipPopup.setLngLat([lng, lat]).addTo(this.map!);
      });

      markerElement.addEventListener('mouseleave', (e: MouseEvent) => {
        const relatedTarget = e.relatedTarget as HTMLElement;
        if (relatedTarget?.closest('.maplibregl-popup')) return;
        isHovering = false;
        tooltipPopup.remove();
      });

      tooltipPopup.on('close', () => {
        isHovering = false;
      });
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

  private handleAddMarkers(args: unknown[], kwargs: Record<string, unknown>): void {
    if (!this.map) return;
    const id = (kwargs.id as string) || `markers-${Date.now()}`;
    const markers = kwargs.markers as Array<{
      lngLat: [number, number];
      popup?: string;
      tooltip?: string;
      scale?: number;
      popupMaxWidth?: string;
      tooltipMaxWidth?: string;
    }>;
    const color = (kwargs.color as string) || '#3388ff';
    const defaultScale = (kwargs.scale as number) ?? 1.0;
    const defaultPopupMaxWidth = (kwargs.popupMaxWidth as string) || '240px';
    const defaultTooltipMaxWidth = (kwargs.tooltipMaxWidth as string) || '240px';
    const draggable = (kwargs.draggable as boolean) || false;

    if (!markers || !Array.isArray(markers)) {
      console.error('addMarkers requires markers array');
      return;
    }

    for (let i = 0; i < markers.length; i++) {
      const markerData = markers[i];
      const markerId = `${id}-${i}`;
      const scale = markerData.scale ?? defaultScale;
      const popupMaxWidth = markerData.popupMaxWidth || defaultPopupMaxWidth;
      const tooltipMaxWidth = markerData.tooltipMaxWidth || defaultTooltipMaxWidth;

      const marker = new this.maplibregl.Marker({ color, scale, draggable }).setLngLat(markerData.lngLat);

      if (markerData.popup) {
        marker.setPopup(new this.maplibregl.Popup({ maxWidth: popupMaxWidth }).setHTML(this.wrapWithContrastStyle(markerData.popup)));
      }

      if (markerData.tooltip) {
        const tooltipPopup = new this.maplibregl.Popup({
          closeButton: false,
          closeOnClick: false,
          maxWidth: tooltipMaxWidth,
          offset: [0, -30 * scale],
          anchor: 'bottom',
        });
        tooltipPopup.setHTML(this.wrapWithContrastStyle(markerData.tooltip));

        const markerElement = marker.getElement();
        const [lng, lat] = markerData.lngLat;
        let isHovering = false;

        markerElement.addEventListener('mouseenter', () => {
          isHovering = true;
          tooltipPopup.setLngLat([lng, lat]).addTo(this.map!);
        });

        markerElement.addEventListener('mouseleave', (e: MouseEvent) => {
          const relatedTarget = e.relatedTarget as HTMLElement;
          if (relatedTarget?.closest('.maplibregl-popup')) return;
          isHovering = false;
          tooltipPopup.remove();
        });

        tooltipPopup.on('close', () => {
          isHovering = false;
        });
      }

      marker.addTo(this.map);
      this.markersMap.set(markerId, marker);
    }
  }

  private handleAddPopup(args: unknown[], kwargs: Record<string, unknown>): void {
    if (!this.map) return;
    const layerId = kwargs.layerId as string;
    const properties = kwargs.properties as string[] | undefined;
    const template = kwargs.template as string | undefined;

    if (!layerId) {
      console.error('addPopup requires layerId');
      return;
    }

    this.map.on('click', layerId, (e: MaplibreGl.MapMouseEvent & { features?: MaplibreGl.MapGeoJSONFeature[] }) => {
      if (!e.features || e.features.length === 0) return;
      const feature = e.features[0];
      const props = feature.properties || {};

      const tableStyle = 'border-collapse: collapse; font-size: 13px; color: #333;';
      const cellStyle = 'padding: 4px 8px; border-bottom: 1px solid #ddd; color: #333;';
      const keyStyle = 'font-weight: 600; color: #222;';
      const valueStyle = 'color: #444;';

      let content: string;
      if (template) {
        const replaced = template.replace(/\{(\w+)\}/g, (match, key) => {
          return props[key] !== undefined ? String(props[key]) : match;
        });
        content = replaced;
      } else if (properties) {
        const rows = properties
          .filter((key) => props[key] !== undefined)
          .map((key) => `<tr><td style="${cellStyle} ${keyStyle}">${key}</td><td style="${cellStyle} ${valueStyle}">${props[key]}</td></tr>`)
          .join('');
        content = `<table style="${tableStyle}">${rows}</table>`;
      } else {
        const rows = Object.entries(props)
          .map(([key, value]) => `<tr><td style="${cellStyle} ${keyStyle}">${key}</td><td style="${cellStyle} ${valueStyle}">${value}</td></tr>`)
          .join('');
        content = `<table style="${tableStyle}">${rows}</table>`;
      }

      new this.maplibregl.Popup()
        .setLngLat(e.lngLat)
        .setHTML(content)
        .addTo(this.map!);
    });

    this.map.on('mouseenter', layerId, () => {
      if (this.map) this.map.getCanvas().style.cursor = 'pointer';
    });
    this.map.on('mouseleave', layerId, () => {
      if (this.map) this.map.getCanvas().style.cursor = '';
    });
  }

  // -------------------------------------------------------------------------
  // Legend and terrain handlers
  // -------------------------------------------------------------------------

  private handleAddLegend(args: unknown[], kwargs: Record<string, unknown>): void {
    if (!this.map) return;
    const legendId = (kwargs.id as string) || `legend-${Date.now()}`;
    const title = (kwargs.title as string) || 'Legend';
    const items = kwargs.items as Array<{ label: string; color: string }> || [];
    const position = (kwargs.position as string) || 'bottom-right';
    const opacity = (kwargs.opacity as number) ?? 1.0;

    if (this.legendsMap.has(legendId)) {
      this.handleRemoveLegend([legendId], {});
    }

    const legendDiv = document.createElement('div');
    legendDiv.id = legendId;
    legendDiv.className = 'maplibregl-ctrl legend-control';
    legendDiv.style.cssText = `
      background: rgba(255, 255, 255, ${opacity});
      padding: 10px 14px;
      border-radius: 4px;
      box-shadow: 0 1px 4px rgba(0,0,0,0.3);
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      font-size: 12px;
      line-height: 1.4;
      max-width: 200px;
    `;

    const titleEl = document.createElement('div');
    titleEl.style.cssText = 'font-weight: bold; margin-bottom: 8px; font-size: 13px; color: #333;';
    titleEl.textContent = title;
    legendDiv.appendChild(titleEl);

    for (const item of items) {
      const row = document.createElement('div');
      row.style.cssText = 'display: flex; align-items: center; margin-bottom: 4px;';

      const colorBox = document.createElement('span');
      colorBox.style.cssText = `
        width: 16px;
        height: 16px;
        background-color: ${item.color};
        margin-right: 8px;
        border-radius: 2px;
        flex-shrink: 0;
      `;
      row.appendChild(colorBox);

      const label = document.createElement('span');
      label.style.color = '#333';
      label.textContent = item.label;
      row.appendChild(label);

      legendDiv.appendChild(row);
    }

    const container = this.map.getContainer();
    const positionClass = `maplibregl-ctrl-${position}`;
    let controlContainer = container.querySelector(`.${positionClass}`) as HTMLElement;
    if (!controlContainer) {
      const controlWrapper = container.querySelector('.maplibregl-control-container');
      if (controlWrapper) {
        controlContainer = document.createElement('div');
        controlContainer.className = `maplibregl-ctrl-${position.split('-')[0]} ${positionClass}`;
        controlWrapper.appendChild(controlContainer);
      }
    }
    if (controlContainer) {
      controlContainer.insertBefore(legendDiv, controlContainer.firstChild);
    }

    this.legendsMap.set(legendId, legendDiv);
  }

  private handleRemoveLegend(args: unknown[], kwargs: Record<string, unknown>): void {
    const legendId = args[0] as string | undefined;

    if (legendId) {
      const legendDiv = this.legendsMap.get(legendId);
      if (legendDiv && legendDiv.parentNode) {
        legendDiv.parentNode.removeChild(legendDiv);
      }
      this.legendsMap.delete(legendId);
    } else {
      for (const [id, legendDiv] of this.legendsMap) {
        if (legendDiv.parentNode) {
          legendDiv.parentNode.removeChild(legendDiv);
        }
      }
      this.legendsMap.clear();
    }
  }

  private handleAddTerrain(args: unknown[], kwargs: Record<string, unknown>): void {
    if (!this.map) return;
    const source = kwargs.source as { url: string; encoding: string };
    const exaggeration = (kwargs.exaggeration as number) ?? 1.0;

    if (!source || !source.url) {
      console.error('addTerrain requires source with url');
      return;
    }

    const sourceId = 'terrain-dem';

    if (!this.map.getSource(sourceId)) {
      this.map.addSource(sourceId, {
        type: 'raster-dem',
        tiles: [source.url],
        tileSize: 256,
        encoding: source.encoding === 'mapbox' ? 'mapbox' : 'terrarium',
      });
    }

    this.map.setTerrain({
      source: sourceId,
      exaggeration: exaggeration,
    });
  }

  // -------------------------------------------------------------------------
  // Draw control handlers
  // -------------------------------------------------------------------------

  private async handleAddDrawControl(args: unknown[], kwargs: Record<string, unknown>): Promise<void> {
    if (!this.map) return;

    const position = (kwargs.position as ControlPosition) || 'top-right';
    const drawModes = kwargs.drawModes as string[] | undefined;
    const editModes = kwargs.editModes as string[] | undefined;
    const collapsed = (kwargs.collapsed as boolean) || false;

    if (!this.geoEditorPlugin) {
      this.geoEditorPlugin = new GeoEditorPlugin(this.map);
    }

    await this.geoEditorPlugin.initialize(
      {
        position,
        drawModes,
        editModes,
        collapsed,
      },
      (data: FeatureCollection) => {
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
    if (!this.geoEditorPlugin) return;

    this.geoEditorPlugin.clear();
    this.model.set('_draw_data', { type: 'FeatureCollection', features: [] });
    this.model.save_changes();
  }

  // -------------------------------------------------------------------------
  // Native MapLibre features
  // -------------------------------------------------------------------------

  private handleSetProjection(args: unknown[], kwargs: Record<string, unknown>): void {
    if (!this.map) return;
    const [projectionType] = args as [string];
    try {
      this.map.setProjection({ type: projectionType } as MaplibreGl.ProjectionSpecification);
    } catch (err) {
      console.warn('Failed to set projection:', err);
    }
  }

  private handleUpdateGeoJSONSource(args: unknown[], kwargs: Record<string, unknown>): void {
    if (!this.map) return;
    const sourceId = kwargs.sourceId as string;
    const data = kwargs.data as FeatureCollection | Feature;

    if (!sourceId) {
      console.error('updateGeoJSONSource requires sourceId');
      return;
    }

    const source = this.map.getSource(sourceId) as MaplibreGl.GeoJSONSource | undefined;
    if (source && source.setData) {
      source.setData(data);
    } else {
      console.warn(`Source ${sourceId} not found or not a GeoJSON source`);
    }
  }

  private handleAddMapImage(args: unknown[], kwargs: Record<string, unknown>): void {
    if (!this.map) return;
    const id = kwargs.id as string;
    const url = kwargs.url as string;

    if (!id || !url) {
      console.error('addMapImage requires id and url');
      return;
    }

    this.map.loadImage(url, (error, image) => {
      if (error) {
        console.error('Error loading image:', error);
        return;
      }
      if (image && !this.map!.hasImage(id)) {
        this.map!.addImage(id, image);
      }
    });
  }

  // -------------------------------------------------------------------------
  // Deck.gl layer handlers
  // -------------------------------------------------------------------------

  protected async initializeDeckOverlay(): Promise<void> {
    if (this.deckOverlay || !this.map) return;

    const { mapbox } = await loadDeckGl();
    this.deckOverlay = new mapbox.MapboxOverlay({ layers: [] });
    this.map.addControl(this.deckOverlay as unknown as MaplibreGl.IControl);
  }

  protected updateDeckOverlay(): void {
    if (this.deckOverlay) {
      const layers = Array.from(this.deckLayers.values()) as (false | null | undefined)[];
      this.deckOverlay.setProps({ layers });
    }
  }

  protected async handleAddCOGLayer(args: unknown[], kwargs: Record<string, unknown>): Promise<void> {
    if (!this.map) return;
    await this.initializeDeckOverlay();

    const id = kwargs.id as string || `cog-${Date.now()}`;
    const geotiff = kwargs.geotiff as string;
    const fitBounds = kwargs.fitBounds !== false;

    const { COGLayer, proj } = await loadGeotiff();
    const geokeysMod = await loadGeokeysParser();

    const geoKeysParser = async (geoKeys: Record<string, unknown>) => {
      const projDefinition = geokeysMod.toProj4(geoKeys as any);
      return {
        def: projDefinition.proj4,
        parsed: proj.parseCrs(projDefinition.proj4),
        coordinatesUnits: projDefinition.coordinatesUnits,
      };
    };

    const layer = new COGLayer({
      id,
      geotiff,
      opacity: kwargs.opacity as number ?? 1,
      visible: kwargs.visible !== false,
      debug: kwargs.debug as boolean ?? false,
      debugOpacity: kwargs.debugOpacity as number ?? 0.25,
      maxError: kwargs.maxError as number ?? 0.125,
      geoKeysParser,
      onGeoTIFFLoad: (tiff: unknown, options: { geographicBounds: { west: number; south: number; east: number; north: number } }) => {
        if (fitBounds && this.map) {
          const { west, south, east, north } = options.geographicBounds;
          this.map.fitBounds([[west, south], [east, north]], { padding: 40, duration: 1000 });
        }
      },
    } as any);

    this.deckLayers.set(id, layer);
    this.updateDeckOverlay();
    if (this.cogAdapter) this.cogAdapter.notifyLayerAdded(id);
  }

  private handleRemoveCOGLayer(args: unknown[], kwargs: Record<string, unknown>): void {
    const [id] = args as [string];
    if (this.cogAdapter) this.cogAdapter.notifyLayerRemoved(id);
    this.deckLayers.delete(id);
    this.updateDeckOverlay();
  }

  protected async handleAddZarrLayer(args: unknown[], kwargs: Record<string, unknown>): Promise<void> {
    if (!this.map) return;

    const id = kwargs.id as string || `zarr-${Date.now()}`;
    const source = kwargs.source as string;
    const variable = kwargs.variable as string;
    const clim = kwargs.clim as [number, number] || [0, 100];
    const colormap = kwargs.colormap as string[] || ['#000000', '#ffffff'];
    const selector = kwargs.selector || {};
    const opacity = kwargs.opacity as number ?? 1;

    const { ZarrLayer } = await loadZarrLayer();

    const layer = new ZarrLayer({
      id, source, variable, clim, colormap,
      selector: selector as any, opacity,
      minzoom: kwargs.minzoom as number,
      maxzoom: kwargs.maxzoom as number,
      fillValue: kwargs.fillValue as number,
      spatialDimensions: kwargs.spatialDimensions as { lat?: string; lon?: string },
      zarrVersion: kwargs.zarrVersion as 2 | 3 | undefined,
      bounds: kwargs.bounds as [number, number, number, number] | undefined,
    });

    this.map.addLayer(layer as unknown as MaplibreGl.CustomLayerInterface);
    this.zarrLayers.set(id, layer);
    if (this.zarrAdapter) this.zarrAdapter.notifyLayerAdded(id);
  }

  private handleRemoveZarrLayer(args: unknown[], kwargs: Record<string, unknown>): void {
    const [id] = args as [string];
    if (this.zarrAdapter) this.zarrAdapter.notifyLayerRemoved(id);
    if (this.map && this.map.getLayer(id)) {
      this.map.removeLayer(id);
    }
    this.zarrLayers.delete(id);
  }

  private handleUpdateZarrLayer(args: unknown[], kwargs: Record<string, unknown>): void {
    const id = kwargs.id as string;
    const layer = this.zarrLayers.get(id);
    if (!layer) return;
    if (kwargs.selector) layer.setSelector(kwargs.selector as Record<string, number>);
    if (kwargs.clim) layer.setClim(kwargs.clim as [number, number]);
    if (kwargs.colormap) layer.setColormap(kwargs.colormap as string[]);
    if (kwargs.opacity !== undefined) layer.setOpacity(kwargs.opacity as number);
  }

  protected async handleAddArcLayer(args: unknown[], kwargs: Record<string, unknown>): Promise<void> {
    if (!this.map) return;
    await this.initializeDeckOverlay();

    const id = kwargs.id as string || `arc-${Date.now()}`;
    const data = kwargs.data as unknown[];

    const makeAccessor = (value: unknown, defaultProp: string, fallbackFn?: (d: any) => any): any => {
      if (typeof value === 'string') return (d: any) => d[value];
      if (typeof value === 'function') return value;
      if (value !== undefined && value !== null) return value;
      return fallbackFn || ((d: any) => d[defaultProp]);
    };

    const { layers } = await loadDeckGl();

    const layer = new layers.ArcLayer({
      id, data,
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
    if (this.deckLayerAdapter) this.deckLayerAdapter.notifyLayerAdded(id);
  }

  private handleRemoveArcLayer(args: unknown[], kwargs: Record<string, unknown>): void {
    const [id] = args as [string];
    if (this.deckLayerAdapter) this.deckLayerAdapter.notifyLayerRemoved(id);
    this.deckLayers.delete(id);
    this.updateDeckOverlay();
  }

  protected async handleAddPointCloudLayer(args: unknown[], kwargs: Record<string, unknown>): Promise<void> {
    if (!this.map) return;
    await this.initializeDeckOverlay();

    const id = kwargs.id as string || `pointcloud-${Date.now()}`;
    const data = kwargs.data as unknown[];

    const makeAccessor = (value: unknown, defaultProp: string, fallbackFn?: (d: any) => any): any => {
      if (typeof value === 'string') return (d: any) => d[value];
      if (typeof value === 'function') return value;
      if (value !== undefined && value !== null) return value;
      return fallbackFn || ((d: any) => d[defaultProp]);
    };

    const { layers } = await loadDeckGl();

    const layerProps: Record<string, unknown> = {
      id, data,
      pickable: kwargs.pickable !== false,
      opacity: kwargs.opacity as number ?? 1,
      pointSize: kwargs.pointSize as number ?? 2,
      getPosition: makeAccessor(kwargs.getPosition, 'position', (d: any) => d.position || d.coordinates || [d.x, d.y, d.z]),
      getNormal: makeAccessor(kwargs.getNormal, 'normal', () => [0, 0, 1]),
      getColor: makeAccessor(kwargs.getColor ?? kwargs.color, 'color', () => [255, 255, 255, 255]),
      sizeUnits: kwargs.sizeUnits as 'pixels' | 'meters' | 'common' ?? 'pixels',
    };

    if (kwargs.coordinateSystem !== undefined) layerProps.coordinateSystem = kwargs.coordinateSystem as number;
    if (kwargs.coordinateOrigin !== undefined) layerProps.coordinateOrigin = kwargs.coordinateOrigin as [number, number, number];

    const layer = new layers.PointCloudLayer(layerProps);

    this.deckLayers.set(id, layer);
    this.updateDeckOverlay();
    if (this.deckLayerAdapter) this.deckLayerAdapter.notifyLayerAdded(id);
  }

  private handleRemovePointCloudLayer(args: unknown[], kwargs: Record<string, unknown>): void {
    const [id] = args as [string];
    if (this.deckLayerAdapter) this.deckLayerAdapter.notifyLayerRemoved(id);
    this.deckLayers.delete(id);
    this.updateDeckOverlay();
  }

  protected async handleAddScatterplotLayer(args: unknown[], kwargs: Record<string, unknown>): Promise<void> {
    if (!this.map) return;
    await this.initializeDeckOverlay();

    const id = kwargs.id as string || `scatterplot-${Date.now()}`;
    const data = kwargs.data as unknown[];

    const { layers } = await loadDeckGl();

    const layer = new layers.ScatterplotLayer({
      id, data,
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
    } as any);

    this.deckLayers.set(id, layer);
    this.updateDeckOverlay();
    if (this.deckLayerAdapter) this.deckLayerAdapter.notifyLayerAdded(id);
  }

  protected async handleAddPathLayer(args: unknown[], kwargs: Record<string, unknown>): Promise<void> {
    if (!this.map) return;
    await this.initializeDeckOverlay();

    const id = kwargs.id as string || `path-${Date.now()}`;
    const data = kwargs.data as unknown[];

    const { layers } = await loadDeckGl();

    const layer = new layers.PathLayer({
      id, data,
      pickable: kwargs.pickable !== false,
      opacity: kwargs.opacity as number ?? 0.8,
      widthScale: kwargs.widthScale as number ?? 1,
      widthMinPixels: kwargs.widthMinPixels as number ?? 1,
      getPath: kwargs.getPath ?? ((d: any) => d.path || d.coordinates),
      getColor: kwargs.getColor ?? kwargs.color ?? [51, 136, 255, 200],
      getWidth: kwargs.getWidth ?? kwargs.width ?? 1,
    } as any);

    this.deckLayers.set(id, layer);
    this.updateDeckOverlay();
    if (this.deckLayerAdapter) this.deckLayerAdapter.notifyLayerAdded(id);
  }

  protected async handleAddPolygonLayer(args: unknown[], kwargs: Record<string, unknown>): Promise<void> {
    if (!this.map) return;
    await this.initializeDeckOverlay();

    const id = kwargs.id as string || `polygon-${Date.now()}`;
    const data = kwargs.data as unknown[];

    const { layers } = await loadDeckGl();

    const layer = new layers.PolygonLayer({
      id, data,
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
    } as any);

    this.deckLayers.set(id, layer);
    this.updateDeckOverlay();
    if (this.deckLayerAdapter) this.deckLayerAdapter.notifyLayerAdded(id);
  }

  protected async handleAddHexagonLayer(args: unknown[], kwargs: Record<string, unknown>): Promise<void> {
    if (!this.map) return;
    await this.initializeDeckOverlay();

    const id = kwargs.id as string || `hexagon-${Date.now()}`;
    const data = kwargs.data as unknown[];

    const { aggregationLayers } = await loadDeckGl();

    const layer = new aggregationLayers.HexagonLayer({
      id, data,
      pickable: kwargs.pickable !== false,
      opacity: kwargs.opacity as number ?? 0.8,
      extruded: kwargs.extruded as boolean ?? true,
      radius: kwargs.radius as number ?? 1000,
      elevationScale: kwargs.elevationScale as number ?? 4,
      getPosition: kwargs.getPosition ?? ((d: any) => d.coordinates || d.position || [d.lng || d.longitude, d.lat || d.latitude]),
      colorRange: kwargs.colorRange ?? [
        [1, 152, 189], [73, 227, 206], [216, 254, 181],
        [254, 237, 177], [254, 173, 84], [209, 55, 78],
      ],
    } as any);

    this.deckLayers.set(id, layer);
    this.updateDeckOverlay();
    if (this.deckLayerAdapter) this.deckLayerAdapter.notifyLayerAdded(id);
  }

  protected async handleAddHeatmapLayer(args: unknown[], kwargs: Record<string, unknown>): Promise<void> {
    if (!this.map) return;
    await this.initializeDeckOverlay();

    const id = kwargs.id as string || `heatmap-${Date.now()}`;
    const data = kwargs.data as unknown[];

    const { aggregationLayers } = await loadDeckGl();

    const layer = new aggregationLayers.HeatmapLayer({
      id, data,
      pickable: false,
      opacity: kwargs.opacity as number ?? 1,
      radiusPixels: kwargs.radiusPixels as number ?? 30,
      intensity: kwargs.intensity as number ?? 1,
      threshold: kwargs.threshold as number ?? 0.05,
      getPosition: kwargs.getPosition ?? ((d: any) => d.coordinates || d.position || [d.lng || d.longitude, d.lat || d.latitude]),
      getWeight: kwargs.getWeight ?? kwargs.weight ?? 1,
      colorRange: (kwargs.colorRange ?? [
        [255, 255, 178, 25], [254, 217, 118, 85], [254, 178, 76, 127],
        [253, 141, 60, 170], [240, 59, 32, 212], [189, 0, 38, 255],
      ]) as any,
    } as any);

    this.deckLayers.set(id, layer);
    this.updateDeckOverlay();
    if (this.deckLayerAdapter) this.deckLayerAdapter.notifyLayerAdded(id);
  }

  protected async handleAddGridLayer(args: unknown[], kwargs: Record<string, unknown>): Promise<void> {
    if (!this.map) return;
    await this.initializeDeckOverlay();

    const id = kwargs.id as string || `grid-${Date.now()}`;
    const data = kwargs.data as unknown[];

    const { aggregationLayers } = await loadDeckGl();

    const layer = new aggregationLayers.GridLayer({
      id, data,
      pickable: kwargs.pickable !== false,
      opacity: kwargs.opacity as number ?? 0.8,
      extruded: kwargs.extruded as boolean ?? true,
      cellSize: kwargs.cellSize as number ?? 200,
      elevationScale: kwargs.elevationScale as number ?? 4,
      getPosition: kwargs.getPosition ?? ((d: any) => d.coordinates || d.position || [d.lng || d.longitude, d.lat || d.latitude]),
      colorRange: kwargs.colorRange ?? [
        [1, 152, 189], [73, 227, 206], [216, 254, 181],
        [254, 237, 177], [254, 173, 84], [209, 55, 78],
      ],
    } as any);

    this.deckLayers.set(id, layer);
    this.updateDeckOverlay();
    if (this.deckLayerAdapter) this.deckLayerAdapter.notifyLayerAdded(id);
  }

  protected async handleAddIconLayer(args: unknown[], kwargs: Record<string, unknown>): Promise<void> {
    if (!this.map) return;
    await this.initializeDeckOverlay();

    const id = kwargs.id as string || `icon-${Date.now()}`;
    const data = kwargs.data as unknown[];

    const { layers } = await loadDeckGl();

    const layer = new layers.IconLayer({
      id, data,
      pickable: kwargs.pickable !== false,
      opacity: kwargs.opacity as number ?? 1,
      iconAtlas: kwargs.iconAtlas as string,
      iconMapping: kwargs.iconMapping as Record<string, any>,
      getIcon: kwargs.getIcon ?? ((d: any) => d.icon || 'marker'),
      getPosition: kwargs.getPosition ?? ((d: any) => d.coordinates || d.position || [d.lng || d.longitude, d.lat || d.latitude]),
      getSize: kwargs.getSize ?? kwargs.size ?? 1,
      getColor: kwargs.getColor ?? kwargs.color ?? [255, 255, 255, 255],
    } as any);

    this.deckLayers.set(id, layer);
    this.updateDeckOverlay();
    if (this.deckLayerAdapter) this.deckLayerAdapter.notifyLayerAdded(id);
  }

  protected async handleAddTextLayer(args: unknown[], kwargs: Record<string, unknown>): Promise<void> {
    if (!this.map) return;
    await this.initializeDeckOverlay();

    const id = kwargs.id as string || `text-${Date.now()}`;
    const data = kwargs.data as unknown[];

    const { layers } = await loadDeckGl();

    const layer = new layers.TextLayer({
      id, data,
      pickable: kwargs.pickable !== false,
      opacity: kwargs.opacity as number ?? 1,
      getPosition: kwargs.getPosition ?? ((d: any) => d.coordinates || d.position || [d.lng || d.longitude, d.lat || d.latitude]),
      getText: kwargs.getText ?? kwargs.text ?? ((d: any) => d.text || d.label || ''),
      getSize: kwargs.getSize ?? kwargs.size ?? 16,
      getColor: kwargs.getColor ?? kwargs.color ?? [0, 0, 0, 255],
      getAngle: kwargs.getAngle ?? kwargs.angle ?? 0,
      getTextAnchor: kwargs.getTextAnchor ?? 'middle',
      getAlignmentBaseline: kwargs.getAlignmentBaseline ?? 'center',
    } as any);

    this.deckLayers.set(id, layer);
    this.updateDeckOverlay();
    if (this.deckLayerAdapter) this.deckLayerAdapter.notifyLayerAdded(id);
  }

  protected async handleAddGeoJsonLayer(args: unknown[], kwargs: Record<string, unknown>): Promise<void> {
    if (!this.map) return;
    await this.initializeDeckOverlay();

    const id = kwargs.id as string || `geojson-${Date.now()}`;
    const data = kwargs.data as unknown[];

    const { layers } = await loadDeckGl();

    const layer = new layers.GeoJsonLayer({
      id, data,
      pickable: kwargs.pickable !== false,
      opacity: kwargs.opacity as number ?? 1,
      stroked: kwargs.stroked !== false,
      filled: kwargs.filled !== false,
      extruded: kwargs.extruded as boolean ?? false,
      wireframe: kwargs.wireframe as boolean ?? false,
      lineWidthMinPixels: kwargs.lineWidthMinPixels as number ?? 1,
      getFillColor: kwargs.getFillColor ?? kwargs.fillColor ?? [51, 136, 255, 128],
      getLineColor: kwargs.getLineColor ?? kwargs.lineColor ?? [0, 0, 255, 255],
      getLineWidth: kwargs.getLineWidth ?? kwargs.lineWidth ?? 1,
      getElevation: kwargs.getElevation ?? kwargs.elevation ?? 0,
    } as any);

    this.deckLayers.set(id, layer);
    this.updateDeckOverlay();
    if (this.deckLayerAdapter) this.deckLayerAdapter.notifyLayerAdded(id);
  }

  protected async handleAddContourLayer(args: unknown[], kwargs: Record<string, unknown>): Promise<void> {
    if (!this.map) return;
    await this.initializeDeckOverlay();

    const id = kwargs.id as string || `contour-${Date.now()}`;
    const data = kwargs.data as unknown[];

    const { aggregationLayers } = await loadDeckGl();

    const layer = new aggregationLayers.ContourLayer({
      id, data,
      pickable: kwargs.pickable !== false,
      opacity: kwargs.opacity as number ?? 1,
      cellSize: kwargs.cellSize as number ?? 100,
      getPosition: kwargs.getPosition ?? ((d: any) => d.coordinates || d.position || [d.lng || d.longitude, d.lat || d.latitude]),
      getWeight: kwargs.getWeight ?? kwargs.weight ?? 1,
      contours: kwargs.contours as any ?? [
        { threshold: 1, color: [255, 0, 0], strokeWidth: 2 },
        { threshold: 5, color: [0, 255, 0], strokeWidth: 2 },
        { threshold: 10, color: [0, 0, 255], strokeWidth: 2 },
      ],
    } as any);

    this.deckLayers.set(id, layer);
    this.updateDeckOverlay();
    if (this.deckLayerAdapter) this.deckLayerAdapter.notifyLayerAdded(id);
  }

  protected async handleAddScreenGridLayer(args: unknown[], kwargs: Record<string, unknown>): Promise<void> {
    if (!this.map) return;
    await this.initializeDeckOverlay();

    const id = kwargs.id as string || `screengrid-${Date.now()}`;
    const data = kwargs.data as unknown[];

    const { aggregationLayers } = await loadDeckGl();

    const layer = new aggregationLayers.ScreenGridLayer({
      id, data,
      pickable: kwargs.pickable ?? false,
      opacity: kwargs.opacity as number ?? 0.8,
      cellSizePixels: kwargs.cellSizePixels as number ?? 50,
      getPosition: kwargs.getPosition ?? ((d: any) => d.coordinates || d.position || [d.lng || d.longitude, d.lat || d.latitude]),
      getWeight: kwargs.getWeight ?? kwargs.weight ?? 1,
      colorRange: kwargs.colorRange as any ?? [
        [255, 255, 178, 25], [254, 217, 118, 85], [254, 178, 76, 127],
        [253, 141, 60, 170], [240, 59, 32, 212], [189, 0, 38, 255],
      ],
    } as any);

    this.deckLayers.set(id, layer);
    this.updateDeckOverlay();
    if (this.deckLayerAdapter) this.deckLayerAdapter.notifyLayerAdded(id);
  }

  protected async handleAddTripsLayer(args: unknown[], kwargs: Record<string, unknown>): Promise<void> {
    if (!this.map) return;
    await this.initializeDeckOverlay();

    const id = kwargs.id as string || `trips-${Date.now()}`;
    const data = kwargs.data as unknown[];

    const { geoLayers } = await loadDeckGl();

    const layer = new geoLayers.TripsLayer({
      id, data,
      pickable: kwargs.pickable !== false,
      opacity: kwargs.opacity as number ?? 1,
      getPath: kwargs.getPath ?? ((d: any) => d.path || d.coordinates),
      getTimestamps: kwargs.getTimestamps ?? ((d: any) => d.timestamps),
      getColor: kwargs.getColor ?? kwargs.color ?? [253, 128, 93],
      trailLength: kwargs.trailLength as number ?? 600,
      currentTime: kwargs.currentTime as number ?? 0,
      capRounded: kwargs.capRounded as boolean ?? true,
      jointRounded: kwargs.jointRounded as boolean ?? true,
    } as any);

    this.deckLayers.set(id, layer);
    this.updateDeckOverlay();
    if (this.deckLayerAdapter) this.deckLayerAdapter.notifyLayerAdded(id);
  }

  protected async handleAddLineLayer(args: unknown[], kwargs: Record<string, unknown>): Promise<void> {
    if (!this.map) return;
    await this.initializeDeckOverlay();

    const id = kwargs.id as string || `line-${Date.now()}`;
    const data = kwargs.data as unknown[];

    const { layers } = await loadDeckGl();

    const layer = new layers.LineLayer({
      id, data,
      pickable: kwargs.pickable !== false,
      opacity: kwargs.opacity as number ?? 1,
      getSourcePosition: kwargs.getSourcePosition ?? ((d: any) => d.source || d.from || d.sourcePosition),
      getTargetPosition: kwargs.getTargetPosition ?? ((d: any) => d.target || d.to || d.targetPosition),
      getColor: kwargs.getColor ?? kwargs.color ?? [0, 100, 255, 255],
      getWidth: kwargs.getWidth ?? kwargs.width ?? 1,
    } as any);

    this.deckLayers.set(id, layer);
    this.updateDeckOverlay();
    if (this.deckLayerAdapter) this.deckLayerAdapter.notifyLayerAdded(id);
  }

  protected async handleAddBitmapLayer(args: unknown[], kwargs: Record<string, unknown>): Promise<void> {
    if (!this.map) return;
    await this.initializeDeckOverlay();

    const id = kwargs.id as string || `bitmap-${Date.now()}`;
    const image = kwargs.image as string;
    const bounds = kwargs.bounds as [number, number, number, number];

    const { layers } = await loadDeckGl();

    const layer = new layers.BitmapLayer({
      id, image, bounds,
      pickable: kwargs.pickable ?? false,
      opacity: kwargs.opacity as number ?? 1,
      transparentColor: kwargs.transparentColor as any ?? [0, 0, 0, 0],
    } as any);

    this.deckLayers.set(id, layer);
    this.updateDeckOverlay();
    if (this.deckLayerAdapter) this.deckLayerAdapter.notifyLayerAdded(id);
  }

  protected async handleAddColumnLayer(args: unknown[], kwargs: Record<string, unknown>): Promise<void> {
    if (!this.map) return;
    await this.initializeDeckOverlay();

    const id = kwargs.id as string || `column-${Date.now()}`;
    const data = kwargs.data as unknown[];

    const { layers } = await loadDeckGl();

    const layer = new layers.ColumnLayer({
      id, data,
      pickable: kwargs.pickable !== false,
      opacity: kwargs.opacity as number ?? 1,
      diskResolution: kwargs.diskResolution as number ?? 20,
      radius: kwargs.radius as number ?? 100,
      extruded: kwargs.extruded as boolean ?? true,
      getPosition: kwargs.getPosition ?? ((d: any) => d.coordinates || d.position || [d.lng || d.longitude, d.lat || d.latitude]),
      getFillColor: kwargs.getFillColor ?? kwargs.fillColor ?? [51, 136, 255, 255],
      getElevation: kwargs.getElevation ?? kwargs.elevation ?? 100,
      getLineColor: kwargs.getLineColor ?? kwargs.lineColor ?? [255, 255, 255, 255],
      getLineWidth: kwargs.getLineWidth ?? kwargs.lineWidth ?? 1,
    } as any);

    this.deckLayers.set(id, layer);
    this.updateDeckOverlay();
    if (this.deckLayerAdapter) this.deckLayerAdapter.notifyLayerAdded(id);
  }

  protected async handleAddGridCellLayer(args: unknown[], kwargs: Record<string, unknown>): Promise<void> {
    if (!this.map) return;
    await this.initializeDeckOverlay();

    const id = kwargs.id as string || `gridcell-${Date.now()}`;
    const data = kwargs.data as unknown[];

    const { layers } = await loadDeckGl();

    const layer = new layers.GridCellLayer({
      id, data,
      pickable: kwargs.pickable !== false,
      opacity: kwargs.opacity as number ?? 1,
      cellSize: kwargs.cellSize as number ?? 1000,
      extruded: kwargs.extruded as boolean ?? true,
      getPosition: kwargs.getPosition ?? ((d: any) => d.coordinates || d.position || [d.lng || d.longitude, d.lat || d.latitude]),
      getFillColor: kwargs.getFillColor ?? kwargs.fillColor ?? [51, 136, 255, 255],
      getElevation: kwargs.getElevation ?? kwargs.elevation ?? 100,
    } as any);

    this.deckLayers.set(id, layer);
    this.updateDeckOverlay();
    if (this.deckLayerAdapter) this.deckLayerAdapter.notifyLayerAdded(id);
  }

  protected async handleAddSolidPolygonLayer(args: unknown[], kwargs: Record<string, unknown>): Promise<void> {
    if (!this.map) return;
    await this.initializeDeckOverlay();

    const id = kwargs.id as string || `solidpolygon-${Date.now()}`;
    const data = kwargs.data as unknown[];

    const { layers } = await loadDeckGl();

    const layer = new layers.SolidPolygonLayer({
      id, data,
      pickable: kwargs.pickable !== false,
      opacity: kwargs.opacity as number ?? 1,
      extruded: kwargs.extruded as boolean ?? true,
      wireframe: kwargs.wireframe as boolean ?? false,
      getPolygon: kwargs.getPolygon ?? ((d: any) => d.polygon || d.contour || d.coordinates),
      getFillColor: kwargs.getFillColor ?? kwargs.fillColor ?? [51, 136, 255, 255],
      getElevation: kwargs.getElevation ?? kwargs.elevation ?? 100,
    } as any);

    this.deckLayers.set(id, layer);
    this.updateDeckOverlay();
    if (this.deckLayerAdapter) this.deckLayerAdapter.notifyLayerAdded(id);
  }

  protected async handleAddDeckGLLayer(args: unknown[], kwargs: Record<string, unknown>): Promise<void> {
    if (!this.map) return;
    await this.initializeDeckOverlay();

    const id = kwargs.id as string || `deck-${Date.now()}`;
    const type = kwargs.type as string;
    const layerProps = kwargs.props as Record<string, unknown> || {};

    const { layers, aggregationLayers, geoLayers } = await loadDeckGl();

    let layer: any;
    switch (type) {
      case 'ScatterplotLayer': layer = new layers.ScatterplotLayer({ id, ...layerProps }); break;
      case 'LineLayer': layer = new layers.LineLayer({ id, ...layerProps }); break;
      case 'PathLayer': layer = new layers.PathLayer({ id, ...layerProps }); break;
      case 'PolygonLayer': layer = new layers.PolygonLayer({ id, ...layerProps }); break;
      case 'GeoJsonLayer': layer = new layers.GeoJsonLayer({ id, ...layerProps }); break;
      case 'ArcLayer': layer = new layers.ArcLayer({ id, ...layerProps }); break;
      case 'BitmapLayer': layer = new layers.BitmapLayer({ id, ...layerProps }); break;
      case 'IconLayer': layer = new layers.IconLayer({ id, ...layerProps }); break;
      case 'TextLayer': layer = new layers.TextLayer({ id, ...layerProps }); break;
      case 'ColumnLayer': layer = new layers.ColumnLayer({ id, ...layerProps }); break;
      case 'GridCellLayer': layer = new layers.GridCellLayer({ id, ...layerProps }); break;
      case 'HexagonLayer': layer = new aggregationLayers.HexagonLayer({ id, ...layerProps }); break;
      case 'HeatmapLayer': layer = new aggregationLayers.HeatmapLayer({ id, ...layerProps }); break;
      case 'GridLayer': layer = new aggregationLayers.GridLayer({ id, ...layerProps }); break;
      case 'ScreenGridLayer': layer = new aggregationLayers.ScreenGridLayer({ id, ...layerProps }); break;
      case 'ContourLayer': layer = new aggregationLayers.ContourLayer({ id, ...layerProps }); break;
      case 'TripsLayer': layer = new geoLayers.TripsLayer({ id, ...layerProps }); break;
      default:
        console.error(`Unknown deck.gl layer type: ${type}`);
        return;
    }

    this.deckLayers.set(id, layer);
    this.updateDeckOverlay();
    if (this.deckLayerAdapter) this.deckLayerAdapter.notifyLayerAdded(id);
  }

  private handleRemoveDeckLayer(args: unknown[], kwargs: Record<string, unknown>): void {
    const [id] = args as [string];
    if (this.deckLayerAdapter) this.deckLayerAdapter.notifyLayerRemoved(id);
    this.deckLayers.delete(id);
    this.updateDeckOverlay();
  }

  private handleSetDeckLayerVisibility(args: unknown[], kwargs: Record<string, unknown>): void {
    const id = kwargs.id as string;
    const visible = kwargs.visible as boolean;
    const layer = this.deckLayers.get(id);
    if (layer) {
      (layer as any).setProps({ visible });
      this.updateDeckOverlay();
    }
  }

  // -------------------------------------------------------------------------
  // LiDAR handlers
  // -------------------------------------------------------------------------

  private async handleAddLidarControl(args: unknown[], kwargs: Record<string, unknown>): Promise<void> {
    if (!this.map) return;
    const { LidarControl } = await loadMaplibreLidar();
    const options: LidarControlOptions = {
      position: (kwargs.position as ControlPosition) || 'top-right',
      collapsed: (kwargs.collapsed as boolean) ?? true,
    };
    this.lidarControl = new LidarControl(options);
    this.map.addControl(this.lidarControl as unknown as MaplibreGl.IControl, options.position);
    this.stateManager.addControl('lidar', 'lidar', options.position!, kwargs);
  }

  private async handleAddLidarLayer(args: unknown[], kwargs: Record<string, unknown>): Promise<void> {
    if (!this.map || !this.lidarControl) {
      console.warn('LiDAR control must be added before adding LiDAR layers');
      return;
    }
    const id = kwargs.id as string || `lidar-${Date.now()}`;
    const url = kwargs.url as string;
    if (!url) {
      console.error('addLidarLayer requires url');
      return;
    }
    const options: LidarLayerOptions = {
      url,
      pointSize: kwargs.pointSize as number ?? 1,
      opacity: kwargs.opacity as number ?? 1,
      colorScheme: (kwargs.colorScheme as LidarColorScheme) ?? 'elevation',
    };
    this.lidarControl.addLayer(id, options);
    this.lidarLayers.set(id, id);
    if (this.lidarAdapter) this.lidarAdapter.notifyLayerAdded(id);
  }

  private handleRemoveLidarLayer(args: unknown[], kwargs: Record<string, unknown>): void {
    if (!this.lidarControl) return;
    const [id] = args as [string];
    if (this.lidarAdapter) this.lidarAdapter.notifyLayerRemoved(id);
    this.lidarControl.removeLayer(id);
    this.lidarLayers.delete(id);
  }

  private handleSetLidarColorScheme(args: unknown[], kwargs: Record<string, unknown>): void {
    if (!this.lidarControl) return;
    const id = kwargs.id as string;
    const colorScheme = kwargs.colorScheme as LidarColorScheme;
    if (!id || !colorScheme) {
      console.error('setLidarColorScheme requires id and colorScheme');
      return;
    }
    this.lidarControl.setColorScheme(id, colorScheme);
  }

  private handleSetLidarPointSize(args: unknown[], kwargs: Record<string, unknown>): void {
    if (!this.lidarControl) return;
    const id = kwargs.id as string;
    const pointSize = kwargs.pointSize as number;
    if (!id || pointSize === undefined) {
      console.error('setLidarPointSize requires id and pointSize');
      return;
    }
    this.lidarControl.setPointSize(id, pointSize);
  }

  private handleSetLidarOpacity(args: unknown[], kwargs: Record<string, unknown>): void {
    if (!this.lidarControl) return;
    const id = kwargs.id as string;
    const opacity = kwargs.opacity as number;
    if (!id || opacity === undefined) {
      console.error('setLidarOpacity requires id and opacity');
      return;
    }
    this.lidarControl.setOpacity(id, opacity);
  }

  // -------------------------------------------------------------------------
  // PMTiles handlers
  // -------------------------------------------------------------------------

  private handleAddPMTilesLayer(args: unknown[], kwargs: Record<string, unknown>): void {
    if (!this.map) return;
    const id = kwargs.id as string || `pmtiles-${Date.now()}`;
    const url = kwargs.url as string;
    if (!url) {
      console.error('addPMTilesLayer requires url');
      return;
    }
    const sourceId = `${id}-source`;
    if (!this.map.getSource(sourceId)) {
      this.map.addSource(sourceId, { type: 'vector', url: `pmtiles://${url}` });
      this.stateManager.addSource(sourceId, { type: 'vector', url: `pmtiles://${url}` });
    }
    console.warn('PMTiles layer source added. Use addLayer to configure the layer style.');
  }

  private handleRemovePMTilesLayer(args: unknown[], kwargs: Record<string, unknown>): void {
    if (!this.map) return;
    const [id] = args as [string];
    const sourceId = `${id}-source`;
    if (this.map.getLayer(id)) {
      this.map.removeLayer(id);
      this.stateManager.removeLayer(id);
    }
    if (this.map.getSource(sourceId)) {
      this.map.removeSource(sourceId);
      this.stateManager.removeSource(sourceId);
    }
  }

  private async handleAddPMTilesControl(args: unknown[], kwargs: Record<string, unknown>): Promise<void> {
    if (!this.map) return;
    const { PMTilesLayerControl } = await loadMaplibreComponents();
    const position = (kwargs.position as ControlPosition) || 'top-right';
    this.pmtilesLayerControl = new PMTilesLayerControl({ position });
    this.map.addControl(this.pmtilesLayerControl as unknown as MaplibreGl.IControl, position);
    this.stateManager.addControl('pmtiles-control', 'pmtiles-control', position, kwargs);
  }

  // -------------------------------------------------------------------------
  // maplibre-gl-components handlers
  // -------------------------------------------------------------------------

  private async handleAddCogControl(args: unknown[], kwargs: Record<string, unknown>): Promise<void> {
    if (!this.map) return;
    const { CogLayerControl } = await loadMaplibreComponents();
    const position = (kwargs.position as ControlPosition) || 'top-right';
    this.cogLayerUiControl = new CogLayerControl({ position });
    this.map.addControl(this.cogLayerUiControl as unknown as MaplibreGl.IControl, position);
    this.stateManager.addControl('cog-control', 'cog-control', position, kwargs);
  }

  private async handleAddZarrControl(args: unknown[], kwargs: Record<string, unknown>): Promise<void> {
    if (!this.map) return;
    const { ZarrLayerControl } = await loadMaplibreComponents();
    const position = (kwargs.position as ControlPosition) || 'top-right';
    this.zarrLayerUiControl = new ZarrLayerControl({ position });
    this.map.addControl(this.zarrLayerUiControl as unknown as MaplibreGl.IControl, position);
    this.stateManager.addControl('zarr-control', 'zarr-control', position, kwargs);
  }

  private async handleAddVectorControl(args: unknown[], kwargs: Record<string, unknown>): Promise<void> {
    if (!this.map) return;
    const { AddVectorControl } = await loadMaplibreComponents();
    const position = (kwargs.position as ControlPosition) || 'top-right';
    this.addVectorControl = new AddVectorControl({ position });
    this.map.addControl(this.addVectorControl as unknown as MaplibreGl.IControl, position);
    this.stateManager.addControl('vector-control', 'vector-control', position, kwargs);
  }

  private async handleAddControlGrid(args: unknown[], kwargs: Record<string, unknown>): Promise<void> {
    if (!this.map) return;
    const { addControlGrid } = await loadMaplibreComponents();
    const position = (kwargs.position as ControlPosition) || 'top-right';
    const title = (kwargs.title as string) || 'Controls';
    const collapsed = (kwargs.collapsed as boolean) ?? true;
    this.controlGrid = addControlGrid(this.map, { position, title, collapsed });
    this.stateManager.addControl('control-grid', 'control-grid', position, kwargs);
  }

  // -------------------------------------------------------------------------
  // Clustering handlers
  // -------------------------------------------------------------------------

  private handleAddClusterLayer(args: unknown[], kwargs: Record<string, unknown>): void {
    if (!this.map) return;
    const id = kwargs.id as string || `cluster-${Date.now()}`;
    const data = kwargs.data as FeatureCollection;
    if (!data) {
      console.error('addClusterLayer requires GeoJSON data');
      return;
    }
    const clusterRadius = kwargs.clusterRadius as number ?? 50;
    const clusterMaxZoom = kwargs.clusterMaxZoom as number ?? 14;
    const sourceId = `${id}-source`;

    if (!this.map.getSource(sourceId)) {
      this.map.addSource(sourceId, {
        type: 'geojson', data, cluster: true, clusterRadius, clusterMaxZoom,
      });
      this.stateManager.addSource(sourceId, { type: 'geojson', data, cluster: true, clusterRadius, clusterMaxZoom } as any);
    }

    this.map.addLayer({
      id: `${id}-clusters`, type: 'circle', source: sourceId, filter: ['has', 'point_count'],
      paint: {
        'circle-color': ['step', ['get', 'point_count'], '#51bbd6', 100, '#f1f075', 750, '#f28cb1'],
        'circle-radius': ['step', ['get', 'point_count'], 20, 100, 30, 750, 40],
      },
    });
    this.map.addLayer({
      id: `${id}-count`, type: 'symbol', source: sourceId, filter: ['has', 'point_count'],
      layout: { 'text-field': '{point_count_abbreviated}', 'text-font': ['DIN Offc Pro Medium', 'Arial Unicode MS Bold'], 'text-size': 12 },
    });
    this.map.addLayer({
      id: `${id}-unclustered`, type: 'circle', source: sourceId, filter: ['!', ['has', 'point_count']],
      paint: { 'circle-color': '#11b4da', 'circle-radius': 4, 'circle-stroke-width': 1, 'circle-stroke-color': '#fff' },
    });

    this.stateManager.addLayer(`${id}-clusters`, { id: `${id}-clusters`, type: 'circle', source: sourceId } as any);
    this.stateManager.addLayer(`${id}-count`, { id: `${id}-count`, type: 'symbol', source: sourceId } as any);
    this.stateManager.addLayer(`${id}-unclustered`, { id: `${id}-unclustered`, type: 'circle', source: sourceId } as any);
  }

  private handleRemoveClusterLayer(args: unknown[], kwargs: Record<string, unknown>): void {
    if (!this.map) return;
    const [id] = args as [string];
    const sourceId = `${id}-source`;
    [`${id}-clusters`, `${id}-count`, `${id}-unclustered`].forEach(layerId => {
      if (this.map!.getLayer(layerId)) {
        this.map!.removeLayer(layerId);
        this.stateManager.removeLayer(layerId);
      }
    });
    if (this.map.getSource(sourceId)) {
      this.map.removeSource(sourceId);
      this.stateManager.removeSource(sourceId);
    }
  }

  // -------------------------------------------------------------------------
  // Choropleth and 3D Buildings
  // -------------------------------------------------------------------------

  private handleAddChoropleth(args: unknown[], kwargs: Record<string, unknown>): void {
    if (!this.map) return;
    const id = kwargs.id as string || `choropleth-${Date.now()}`;
    const data = kwargs.data as FeatureCollection;
    const property = kwargs.property as string;
    const colors = kwargs.colors as string[] || ['#ffffcc', '#c7e9b4', '#7fcdbb', '#41b6c4', '#2c7fb8', '#253494'];
    if (!data || !property) {
      console.error('addChoropleth requires data and property');
      return;
    }
    const sourceId = `${id}-source`;
    if (!this.map.getSource(sourceId)) {
      this.map.addSource(sourceId, { type: 'geojson', data });
      this.stateManager.addSource(sourceId, { type: 'geojson', data });
    }
    this.map.addLayer({
      id, type: 'fill', source: sourceId,
      paint: {
        'fill-color': ['interpolate', ['linear'], ['get', property], ...colors.flatMap((c, i) => [i / (colors.length - 1), c])],
        'fill-opacity': 0.7,
        'fill-outline-color': '#fff',
      },
    });
    this.stateManager.addLayer(id, { id, type: 'fill', source: sourceId } as any);
  }

  private handleAdd3DBuildings(args: unknown[], kwargs: Record<string, unknown>): void {
    if (!this.map) return;
    const id = kwargs.id as string || '3d-buildings';
    const sourceLayer = kwargs.sourceLayer as string || 'building';
    const minZoom = kwargs.minZoom as number ?? 15;
    this.map.addLayer({
      id, source: 'composite', 'source-layer': sourceLayer, filter: ['==', 'extrude', 'true'],
      type: 'fill-extrusion', minzoom: minZoom,
      paint: {
        'fill-extrusion-color': '#aaa',
        'fill-extrusion-height': ['get', 'height'],
        'fill-extrusion-base': ['get', 'min_height'],
        'fill-extrusion-opacity': 0.6,
      },
    });
    this.stateManager.addLayer(id, { id, type: 'fill-extrusion', source: 'composite' } as any);
  }

  // -------------------------------------------------------------------------
  // Route Animation handlers
  // -------------------------------------------------------------------------

  private async handleAnimateAlongRoute(args: unknown[], kwargs: Record<string, unknown>): Promise<void> {
    if (!this.map) return;
    const id = kwargs.id as string || `animation-${Date.now()}`;
    const coordinates = kwargs.coordinates as [number, number][];
    const speed = kwargs.speed as number ?? 1;
    const loop = kwargs.loop as boolean ?? false;
    const trail = kwargs.trail as boolean ?? false;
    const trailColor = kwargs.trailColor as string ?? '#3388ff';
    const trailWidth = kwargs.trailWidth as number ?? 2;

    if (!coordinates || coordinates.length < 2) {
      console.error('animateAlongRoute requires at least 2 coordinates');
      return;
    }

    const { along, length: turfLength, lineString } = await loadTurf();
    const route = lineString(coordinates);
    const routeLength = turfLength(route);
    const duration = (routeLength / speed) * 1000;

    const marker = new this.maplibregl.Marker({ color: kwargs.markerColor as string ?? '#ff0000' })
      .setLngLat(coordinates[0]).addTo(this.map);

    let trailSourceId: string | undefined;
    let trailLayerId: string | undefined;

    if (trail) {
      trailSourceId = `${id}-trail-source`;
      trailLayerId = `${id}-trail-layer`;
      this.map.addSource(trailSourceId, {
        type: 'geojson',
        data: { type: 'Feature', properties: {}, geometry: { type: 'LineString', coordinates: [coordinates[0]] } },
      });
      this.map.addLayer({
        id: trailLayerId, type: 'line', source: trailSourceId,
        layout: { 'line-join': 'round', 'line-cap': 'round' },
        paint: { 'line-color': trailColor, 'line-width': trailWidth },
      });
    }

    let startTime: number | null = null;
    let animationId: number;
    let isPaused = false;
    let pausedAt = 0;

    const animate = (timestamp: number) => {
      if (isPaused) return;
      if (!startTime) startTime = timestamp - pausedAt;
      const elapsed = timestamp - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const currentDistance = progress * routeLength;
      const currentPosition = along(route, currentDistance);

      if (currentPosition?.geometry) {
        const coords = currentPosition.geometry.coordinates as [number, number];
        marker.setLngLat(coords);
        if (trail && trailSourceId) {
          const source = this.map!.getSource(trailSourceId) as MaplibreGl.GeoJSONSource;
          if (source) {
            const trailCoords = coordinates.slice(0, Math.floor(progress * coordinates.length) + 1);
            trailCoords.push(coords);
            source.setData({ type: 'Feature', properties: {}, geometry: { type: 'LineString', coordinates: trailCoords } });
          }
        }
      }

      if (progress < 1) {
        animationId = requestAnimationFrame(animate);
      } else if (loop) {
        startTime = null;
        pausedAt = 0;
        animationId = requestAnimationFrame(animate);
      }
    };

    animationId = requestAnimationFrame(animate);

    this.animations.set(id, {
      animationId, marker, isPaused: false, speed, startTime: Date.now(),
      pausedAt: 0, duration, coordinates, loop, trailSourceId, trailLayerId,
    });
  }

  private handleStopAnimation(args: unknown[], kwargs: Record<string, unknown>): void {
    const [id] = args as [string];
    const animation = this.animations.get(id);
    if (animation) {
      cancelAnimationFrame(animation.animationId);
      animation.marker.remove();
      if (animation.trailLayerId && this.map!.getLayer(animation.trailLayerId)) {
        this.map!.removeLayer(animation.trailLayerId);
      }
      if (animation.trailSourceId && this.map!.getSource(animation.trailSourceId)) {
        this.map!.removeSource(animation.trailSourceId);
      }
      this.animations.delete(id);
    }
  }

  private handlePauseAnimation(args: unknown[], kwargs: Record<string, unknown>): void {
    const [id] = args as [string];
    const animation = this.animations.get(id);
    if (animation) {
      cancelAnimationFrame(animation.animationId);
      animation.isPaused = true;
      animation.pausedAt = Date.now() - animation.startTime;
    }
  }

  private handleResumeAnimation(args: unknown[], kwargs: Record<string, unknown>): void {
    const [id] = args as [string];
    const animation = this.animations.get(id);
    if (animation && animation.isPaused) {
      animation.isPaused = false;
      animation.startTime = Date.now() - animation.pausedAt;
      // Note: The animation loop would need to be restarted here
      // For simplicity, we'll require calling animateAlongRoute again
    }
  }

  private handleSetAnimationSpeed(args: unknown[], kwargs: Record<string, unknown>): void {
    const id = kwargs.id as string;
    const speed = kwargs.speed as number;
    if (!id || speed === undefined) {
      console.error('setAnimationSpeed requires id and speed');
      return;
    }
    const animation = this.animations.get(id);
    if (animation) {
      animation.speed = speed;
    }
  }

  // -------------------------------------------------------------------------
  // UI Controls (placeholders for now)
  // -------------------------------------------------------------------------

  private handleAddTimeSlider(args: unknown[], kwargs: Record<string, unknown>): void {
    console.warn('addTimeSlider not yet implemented with CDN imports');
  }

  private handleRemoveTimeSlider(args: unknown[], kwargs: Record<string, unknown>): void {
    console.warn('removeTimeSlider not yet implemented');
  }

  private handleAddSwipeMap(args: unknown[], kwargs: Record<string, unknown>): void {
    console.warn('addSwipeMap not yet implemented with CDN imports');
  }

  private handleRemoveSwipeMap(args: unknown[], kwargs: Record<string, unknown>): void {
    console.warn('removeSwipeMap not yet implemented');
  }

  private handleAddOpacitySlider(args: unknown[], kwargs: Record<string, unknown>): void {
    console.warn('addOpacitySlider not yet implemented with CDN imports');
  }

  private handleRemoveOpacitySlider(args: unknown[], kwargs: Record<string, unknown>): void {
    console.warn('removeOpacitySlider not yet implemented');
  }

  private handleAddStyleSwitcher(args: unknown[], kwargs: Record<string, unknown>): void {
    console.warn('addStyleSwitcher not yet implemented with CDN imports');
  }

  private handleRemoveStyleSwitcher(args: unknown[], kwargs: Record<string, unknown>): void {
    console.warn('removeStyleSwitcher not yet implemented');
  }

  // -------------------------------------------------------------------------
  // Query and Feature handlers
  // -------------------------------------------------------------------------

  private handleGetVisibleFeatures(args: unknown[], kwargs: Record<string, unknown>): void {
    if (!this.map) return;
    const layers = kwargs.layers as string[] | undefined;
    const filter = kwargs.filter as any[] | undefined;
    const features = this.map.queryRenderedFeatures(undefined, { layers, filter });
    this.model.set('_queried_features', { type: 'FeatureCollection', features });
    this.model.save_changes();
  }

  private handleGetLayerData(args: unknown[], kwargs: Record<string, unknown>): void {
    if (!this.map) return;
    const layerId = kwargs.layerId as string;
    if (!layerId) {
      console.error('getLayerData requires layerId');
      return;
    }
    const layer = this.map.getLayer(layerId);
    if (!layer) {
      console.warn(`Layer ${layerId} not found`);
      return;
    }
    const layerInfo = { id: layer.id, type: layer.type, source: layer.source, layout: layer.layout, paint: layer.paint };
    this.model.set('_queried_features', layerInfo);
    this.model.save_changes();
  }

  private handleQueryRenderedFeatures(args: unknown[], kwargs: Record<string, unknown>): void {
    if (!this.map) return;
    const geometry = kwargs.geometry;
    const options = kwargs.options as { layers?: string[]; filter?: any[] } | undefined;
    const features = this.map.queryRenderedFeatures(geometry, options);
    this.model.set('_queried_features', { type: 'FeatureCollection', features });
    this.model.save_changes();
  }

  private handleQuerySourceFeatures(args: unknown[], kwargs: Record<string, unknown>): void {
    if (!this.map) return;
    const sourceId = kwargs.sourceId as string;
    const options = kwargs.options as { sourceLayer?: string; filter?: any[] } | undefined;
    if (!sourceId) {
      console.error('querySourceFeatures requires sourceId');
      return;
    }
    const features = this.map.querySourceFeatures(sourceId, options);
    this.model.set('_queried_features', { type: 'FeatureCollection', features });
    this.model.save_changes();
  }

  private handleSetFilter(args: unknown[], kwargs: Record<string, unknown>): void {
    if (!this.map) return;
    const layerId = kwargs.layerId as string;
    const filter = kwargs.filter as any[];
    if (!layerId || !filter) {
      console.error('setFilter requires layerId and filter');
      return;
    }
    if (this.map.getLayer(layerId)) {
      this.map.setFilter(layerId, filter);
    }
  }

  // -------------------------------------------------------------------------
  // Hover and Sky handlers
  // -------------------------------------------------------------------------

  private handleAddHoverEffect(args: unknown[], kwargs: Record<string, unknown>): void {
    if (!this.map) return;
    const layerId = kwargs.layerId as string;
    if (!layerId) {
      console.error('addHoverEffect requires layerId');
      return;
    }

    let hoveredFeatureId: string | number | null = null;

    this.map.on('mousemove', layerId, (e: MaplibreGl.MapMouseEvent & { features?: MaplibreGl.MapGeoJSONFeature[] }) => {
      if (e.features && e.features.length > 0) {
        if (hoveredFeatureId !== null) {
          this.map!.setFeatureState({ source: e.features[0].source, id: hoveredFeatureId }, { hover: false });
        }
        hoveredFeatureId = e.features[0].id!;
        this.map!.setFeatureState({ source: e.features[0].source, id: hoveredFeatureId }, { hover: true });
      }
    });

    this.map.on('mouseleave', layerId, () => {
      if (hoveredFeatureId !== null) {
        const source = this.map!.getLayer(layerId)?.source;
        if (source) {
          this.map!.setFeatureState({ source, id: hoveredFeatureId }, { hover: false });
        }
        hoveredFeatureId = null;
      }
    });
  }

  private handleSetSky(args: unknown[], kwargs: Record<string, unknown>): void {
    if (!this.map) return;
    this.map.setSky({
      'sky-type': (kwargs.skyType as string) ?? 'atmosphere',
      'sky-atmosphere-sun': kwargs.sun as [number, number] ?? [0, 0],
      'sky-atmosphere-sun-intensity': kwargs.sunIntensity as number ?? 10,
    } as any);
  }

  private handleRemoveSky(args: unknown[], kwargs: Record<string, unknown>): void {
    if (!this.map) return;
    this.map.setSky({ 'sky-type': 'none' } as any);
  }

  // -------------------------------------------------------------------------
  // Video handlers
  // -------------------------------------------------------------------------

  private handleAddVideoLayer(args: unknown[], kwargs: Record<string, unknown>): void {
    if (!this.map) return;
    const id = kwargs.id as string || `video-${Date.now()}`;
    const urls = kwargs.urls as string[];
    const coordinates = kwargs.coordinates as number[][];

    if (!urls || !coordinates) {
      console.error('addVideoLayer requires urls and coordinates');
      return;
    }

    const sourceId = `${id}-source`;
    this.map.addSource(sourceId, { type: 'video', urls, coordinates: coordinates as any });
    this.map.addLayer({ id, type: 'raster', source: sourceId });
    this.videoSources.set(id, sourceId);
  }

  private handleRemoveVideoLayer(args: unknown[], kwargs: Record<string, unknown>): void {
    if (!this.map) return;
    const [id] = args as [string];
    const sourceId = this.videoSources.get(id);
    if (this.map.getLayer(id)) this.map.removeLayer(id);
    if (sourceId && this.map.getSource(sourceId)) this.map.removeSource(sourceId);
    this.videoSources.delete(id);
  }

  private handlePlayVideo(args: unknown[], kwargs: Record<string, unknown>): void {
    if (!this.map) return;
    const id = kwargs.id as string;
    const sourceId = this.videoSources.get(id);
    if (sourceId) {
      const source = this.map.getSource(sourceId) as MaplibreGl.VideoSource;
      if (source && source.play) source.play();
    }
  }

  private handlePauseVideo(args: unknown[], kwargs: Record<string, unknown>): void {
    if (!this.map) return;
    const id = kwargs.id as string;
    const sourceId = this.videoSources.get(id);
    if (sourceId) {
      const source = this.map.getSource(sourceId) as MaplibreGl.VideoSource;
      if (source && source.pause) source.pause();
    }
  }

  private handleSeekVideo(args: unknown[], kwargs: Record<string, unknown>): void {
    if (!this.map) return;
    const id = kwargs.id as string;
    const time = kwargs.time as number;
    const sourceId = this.videoSources.get(id);
    if (sourceId) {
      const source = this.map.getSource(sourceId) as MaplibreGl.VideoSource;
      if (source && source.getVideo) {
        const video = source.getVideo();
        if (video) video.currentTime = time;
      }
    }
  }

  // -------------------------------------------------------------------------
  // Split Map handlers
  // -------------------------------------------------------------------------

  private handleAddSplitMap(args: unknown[], kwargs: Record<string, unknown>): void {
    console.warn('addSplitMap not yet implemented with CDN imports');
  }

  private handleRemoveSplitMap(args: unknown[], kwargs: Record<string, unknown>): void {
    if (!this.map) return;
    if (this.splitActive) {
      if (this.splitMapRight) {
        this.splitMapRight.remove();
        this.splitMapRight = null;
      }
      if (this.splitMapContainer && this.splitMapContainer.parentNode) {
        this.splitMapContainer.parentNode.removeChild(this.splitMapContainer);
      }
      if (this.splitSlider && this.splitSlider.parentNode) {
        this.splitSlider.parentNode.removeChild(this.splitSlider);
      }
      this.splitMapContainer = null;
      this.splitSlider = null;
      this.splitActive = false;
      this.map.resize();
    }
  }

  // -------------------------------------------------------------------------
  // Colorbar handlers
  // -------------------------------------------------------------------------

  private async handleAddColorbar(args: unknown[], kwargs: Record<string, unknown>): Promise<void> {
    if (!this.map) return;
    const { Colorbar } = await loadMaplibreComponents();
    const id = kwargs.id as string || `colorbar-${Date.now()}`;
    const position = (kwargs.position as string) || 'bottom-left';
    const min = kwargs.min as number ?? 0;
    const max = kwargs.max as number ?? 100;
    const colormap = kwargs.colormap as string[] ?? ['#ffffff', '#000000'];
    const title = kwargs.title as string ?? '';

    const colorbar = new Colorbar({
      position,
      min,
      max,
      colormap,
      title,
    });

    this.map.addControl(colorbar as unknown as MaplibreGl.IControl, position as ControlPosition);
    this.colorbarsMap.set(id, colorbar);
  }

  private handleRemoveColorbar(args: unknown[], kwargs: Record<string, unknown>): void {
    if (!this.map) return;
    const [id] = args as [string];
    const colorbar = this.colorbarsMap.get(id);
    if (colorbar) {
      this.map.removeControl(colorbar as unknown as MaplibreGl.IControl);
      this.colorbarsMap.delete(id);
    }
  }

  private handleUpdateColorbar(args: unknown[], kwargs: Record<string, unknown>): void {
    const id = kwargs.id as string;
    const min = kwargs.min as number;
    const max = kwargs.max as number;
    const colorbar = this.colorbarsMap.get(id);
    if (colorbar) {
      if (min !== undefined) colorbar.setMin(min);
      if (max !== undefined) colorbar.setMax(max);
    }
  }

  // -------------------------------------------------------------------------
  // Search, Measure, Print controls
  // -------------------------------------------------------------------------

  private async handleAddSearchControl(args: unknown[], kwargs: Record<string, unknown>): Promise<void> {
    if (!this.map) return;
    const { SearchControl } = await loadMaplibreComponents();
    const position = (kwargs.position as ControlPosition) || 'top-right';
    this.searchControl = new SearchControl({ position });
    this.map.addControl(this.searchControl as unknown as MaplibreGl.IControl, position);
    this.stateManager.addControl('search', 'search', position, kwargs);
  }

  private handleRemoveSearchControl(args: unknown[], kwargs: Record<string, unknown>): void {
    if (!this.map) return;
    if (this.searchControl) {
      this.map.removeControl(this.searchControl as unknown as MaplibreGl.IControl);
      this.searchControl = null;
    }
  }

  private async handleAddMeasureControl(args: unknown[], kwargs: Record<string, unknown>): Promise<void> {
    if (!this.map) return;
    const { MeasureControl } = await loadMaplibreComponents();
    const position = (kwargs.position as ControlPosition) || 'top-right';
    this.measureControl = new MeasureControl({ position });
    this.map.addControl(this.measureControl as unknown as MaplibreGl.IControl, position);
    this.stateManager.addControl('measure', 'measure', position, kwargs);
  }

  private handleRemoveMeasureControl(args: unknown[], kwargs: Record<string, unknown>): void {
    if (!this.map) return;
    if (this.measureControl) {
      this.map.removeControl(this.measureControl as unknown as MaplibreGl.IControl);
      this.measureControl = null;
    }
  }

  private async handleAddPrintControl(args: unknown[], kwargs: Record<string, unknown>): Promise<void> {
    if (!this.map) return;
    const { PrintControl } = await loadMaplibreComponents();
    const position = (kwargs.position as ControlPosition) || 'top-right';
    this.printControl = new PrintControl({ position });
    this.map.addControl(this.printControl as unknown as MaplibreGl.IControl, position);
    this.stateManager.addControl('print', 'print', position, kwargs);
  }

  private handleRemovePrintControl(args: unknown[], kwargs: Record<string, unknown>): void {
    if (!this.map) return;
    if (this.printControl) {
      this.map.removeControl(this.printControl as unknown as MaplibreGl.IControl);
      this.printControl = null;
    }
  }

  // -------------------------------------------------------------------------
  // FlatGeobuf handlers
  // -------------------------------------------------------------------------

  private async handleAddFlatGeobuf(args: unknown[], kwargs: Record<string, unknown>): Promise<void> {
    if (!this.map) return;
    const id = kwargs.id as string || `flatgeobuf-${Date.now()}`;
    const url = kwargs.url as string;
    const layerType = (kwargs.layerType as string) || 'circle';
    const paint = kwargs.paint as Record<string, unknown> | undefined;

    if (!url) {
      console.error('addFlatGeobuf requires url');
      return;
    }

    const sourceId = `${id}-source`;
    
    // Fetch and parse FlatGeobuf data
    try {
      const response = await fetch(url);
      const arrayBuffer = await response.arrayBuffer();
      const uint8Array = new Uint8Array(arrayBuffer);
      
      // Parse FlatGeobuf to GeoJSON
      const { geojson: flatgeobuf } = await import('https://esm.sh/flatgeobuf@3.35.0/lib/geojson.mjs');
      const geojson = flatgeobuf(uint8Array);
      
      if (!this.map.getSource(sourceId)) {
        this.map.addSource(sourceId, { type: 'geojson', data: geojson as any });
        this.stateManager.addSource(sourceId, { type: 'geojson', data: geojson as any } as any);
      }

      const defaultPaint = this.getDefaultPaint(layerType);
      const layerPaint = paint || defaultPaint;

      if (!this.map.getLayer(id)) {
        this.map.addLayer({
          id,
          type: layerType as MaplibreGl.LayerSpecification['type'],
          source: sourceId,
          paint: layerPaint,
        } as MaplibreGl.AddLayerObject);
        this.stateManager.addLayer(id, { id, type: layerType, source: sourceId, paint: layerPaint } as any);
      }
    } catch (error) {
      console.error('Error loading FlatGeobuf:', error);
    }
  }

  private handleRemoveFlatGeobuf(args: unknown[], kwargs: Record<string, unknown>): void {
    if (!this.map) return;
    const [id] = args as [string];
    const sourceId = `${id}-source`;
    
    if (this.map.getLayer(id)) {
      this.map.removeLayer(id);
      this.stateManager.removeLayer(id);
    }
    if (this.map.getSource(sourceId)) {
      this.map.removeSource(sourceId);
      this.stateManager.removeSource(sourceId);
    }
  }

  // -------------------------------------------------------------------------
  // Cleanup
  // -------------------------------------------------------------------------

  destroy(): void {
    // Stop all animations
    for (const [id, animation] of this.animations) {
      cancelAnimationFrame(animation.animationId);
      animation.marker.remove();
      if (animation.trailLayerId && this.map?.getLayer(animation.trailLayerId)) {
        this.map.removeLayer(animation.trailLayerId);
      }
      if (animation.trailSourceId && this.map?.getSource(animation.trailSourceId)) {
        this.map.removeSource(animation.trailSourceId);
      }
    }
    this.animations.clear();

    // Remove markers
    for (const [id, marker] of this.markersMap) {
      marker.remove();
    }
    this.markersMap.clear();

    // Remove resize observer
    if (this.resizeObserver) {
      this.resizeObserver.disconnect();
      this.resizeObserver = null;
    }

    // Remove all layers and sources from state manager
    this.stateManager.clear();

    // Call parent destroy
    super.destroy();
  }
}
