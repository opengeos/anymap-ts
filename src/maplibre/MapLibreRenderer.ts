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
  BitmapLayer,
  ColumnLayer,
  GridCellLayer,
  SolidPolygonLayer,
} from '@deck.gl/layers';
import {
  HexagonLayer,
  HeatmapLayer,
  GridLayer,
  ContourLayer,
  ScreenGridLayer,
} from '@deck.gl/aggregation-layers';
import { TripsLayer } from '@deck.gl/geo-layers';
import along from '@turf/along';
import length from '@turf/length';
import { lineString } from '@turf/helpers';
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
  SkySpecification,
  DEFAULT_PAINT,
  inferLayerType,
} from '../types/maplibre';
import type { Feature, FeatureCollection } from 'geojson';

import { GeoEditorPlugin } from './plugins/GeoEditorPlugin';
import { LayerControlPlugin } from './plugins/LayerControlPlugin';
import { COGLayerAdapter, ZarrLayerAdapter, DeckLayerAdapter, MarkerLayerAdapter } from './adapters';
import { LidarControl, LidarLayerAdapter } from 'maplibre-gl-lidar';
import type { LidarControlOptions, LidarLayerOptions, LidarColorScheme } from '../types/lidar';
import { GeoPhotoControl } from 'maplibre-gl-geophoto';

// Import controls from maplibre-gl-components
import {
  PMTilesLayerControl,
  CogLayerControl,
  ZarrLayerControl,
  AddVectorControl,
  addControlGrid,
  Colorbar,
  SearchControl,
  MeasureControl,
  PrintControl,
} from 'maplibre-gl-components';
import type { ControlGrid } from 'maplibre-gl-components';
import 'maplibre-gl-components/style.css';

// FlatGeobuf for streaming cloud-native vector data
import { geojson as flatgeobuf } from 'flatgeobuf';

/**
 * Parse GeoKeys to proj4 definition for COG reprojection.
 */
async function geoKeysParser(
  geoKeys: Record<string, unknown>,
): Promise<proj.ProjectionInfo> {
  const projDefinition = toProj4(geoKeys as unknown as Parameters<typeof toProj4>[0]);

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
  private legendsMap: globalThis.Map<string, HTMLElement> = new globalThis.Map();
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
  private lidarAdapter: LidarLayerAdapter | null = null;
  private markerAdapter: MarkerLayerAdapter | null = null;
  private markerGroupsMap: globalThis.Map<string, Marker[]> = new globalThis.Map();

  // LiDAR control
  protected lidarControl: LidarControl | null = null;
  protected lidarLayers: globalThis.Map<string, string> = new globalThis.Map(); // id -> source mapping

  // maplibre-gl-components controls
  protected pmtilesLayerControl: PMTilesLayerControl | null = null;
  protected cogLayerUiControl: CogLayerControl | null = null;
  protected zarrLayerUiControl: ZarrLayerControl | null = null;
  protected addVectorControl: AddVectorControl | null = null;
  protected controlGrid: ControlGrid | null = null;

  // Colorbar, Search, Measure, Print controls
  protected colorbarsMap: globalThis.Map<string, Colorbar> = new globalThis.Map();
  protected searchControl: SearchControl | null = null;
  protected measureControl: MeasureControl | null = null;
  protected printControl: PrintControl | null = null;
  protected geoPhotoControl: GeoPhotoControl | null = null;

  // Route animations
  protected animations: globalThis.Map<string, {
    animationId: number;
    marker: Marker;
    isPaused: boolean;
    speed: number;
    startTime: number;
    pausedAt: number;
    duration: number;
    coordinates: [number, number][];
    loop: boolean;
    trailSourceId?: string;
    trailLayerId?: string;
  }> = new globalThis.Map();

  // Feature hover state tracking
  protected hoveredFeatureId: string | number | null = null;
  protected hoveredLayerId: string | null = null;

  // Video sources tracking (layer id -> source id)
  protected videoSources: globalThis.Map<string, string> = new globalThis.Map();

  // Split map state
  private splitMapRight: MapLibreMap | null = null;
  private splitMapContainer: HTMLDivElement | null = null;
  private splitSlider: HTMLDivElement | null = null;
  private splitActive: boolean = false;

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
        // Restore persisted state (layers, sources) before processing new calls
        // This ensures layers are restored when map is displayed in subsequent cells
        this.restoreState();
        // Apply initial projection from model trait (must be done after style loads)
        const initProjection = this.model.get('projection') as string;
        if (initProjection && initProjection !== 'mercator') {
          try {
            this.map!.setProjection({ type: initProjection } as maplibregl.ProjectionSpecification);
          } catch (err) {
            console.warn('Failed to set initial projection:', err);
          }
        }
        // Process any calls that were queued while waiting for map to load
        this.processPendingCalls();
        // Resize after load to ensure correct dimensions
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
        // Debounce resize to prevent flickering during window resize
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
    const maxPitchValue = this.model.get('max_pitch');
    const maxPitch = typeof maxPitchValue === 'number' ? maxPitchValue : 85;
    const maxZoomValue = this.model.get('max_zoom');
    const maxZoom = typeof maxZoomValue === 'number' ? maxZoomValue : 25.5;

    return new MapLibreMap({
      container: this.mapContainer!,
      style: typeof style === 'string' ? style : (style as maplibregl.StyleSpecification),
      center: center as [number, number],
      zoom,
      bearing,
      pitch,
      maxPitch,
      maxZoom,
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
    this.registerMethod('addImageLayer', this.handleAddImageLayer.bind(this));

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
    this.registerMethod('addMarkers', this.handleAddMarkers.bind(this));
    this.registerMethod('removeMarker', this.handleRemoveMarker.bind(this));
    this.registerMethod('addPopup', this.handleAddPopup.bind(this));

    // Legend
    this.registerMethod('addLegend', this.handleAddLegend.bind(this));
    this.registerMethod('removeLegend', this.handleRemoveLegend.bind(this));

    // Terrain
    this.registerMethod('addTerrain', this.handleAddTerrain.bind(this));

    // Layer management (moveLayer is new, setPaintProperty/setLayoutProperty already registered)
    this.registerMethod('moveLayer', this.handleMoveLayer.bind(this));

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

    // Additional deck.gl layers
    this.registerMethod('addBitmapLayer', this.handleAddBitmapLayer.bind(this));
    this.registerMethod('addColumnLayer', this.handleAddColumnLayer.bind(this));
    this.registerMethod('addGridCellLayer', this.handleAddGridCellLayer.bind(this));
    this.registerMethod('addSolidPolygonLayer', this.handleAddSolidPolygonLayer.bind(this));
    // Note: Heavy geo-layers (MVT, Tile3D, Terrain, H3, S2, etc.) and mesh-layers
    // (SimpleMesh, Scenegraph) are only available in DeckGLRenderer to keep the
    // maplibre.js bundle lightweight.

    // Native MapLibre features
    this.registerMethod('setProjection', this.handleSetProjection.bind(this));
    this.registerMethod('updateGeoJSONSource', this.handleUpdateGeoJSONSource.bind(this));
    this.registerMethod('addMapImage', this.handleAddMapImage.bind(this));
    this.registerMethod('addTooltip', this.handleAddTooltip.bind(this));
    this.registerMethod('removeTooltip', this.handleRemoveTooltip.bind(this));
    this.registerMethod('addCoordinatesControl', this.handleAddCoordinatesControl.bind(this));
    this.registerMethod('removeCoordinatesControl', this.handleRemoveCoordinatesControl.bind(this));

    // Time slider
    this.registerMethod('addTimeSlider', this.handleAddTimeSlider.bind(this));
    this.registerMethod('removeTimeSlider', this.handleRemoveTimeSlider.bind(this));

    // UI enhancements
    this.registerMethod('addSwipeMap', this.handleAddSwipeMap.bind(this));
    this.registerMethod('removeSwipeMap', this.handleRemoveSwipeMap.bind(this));
    this.registerMethod('addOpacitySlider', this.handleAddOpacitySlider.bind(this));
    this.registerMethod('removeOpacitySlider', this.handleRemoveOpacitySlider.bind(this));
    this.registerMethod('addStyleSwitcher', this.handleAddStyleSwitcher.bind(this));
    this.registerMethod('removeStyleSwitcher', this.handleRemoveStyleSwitcher.bind(this));

    // Data export
    this.registerMethod('getVisibleFeatures', this.handleGetVisibleFeatures.bind(this));
    this.registerMethod('getLayerData', this.handleGetLayerData.bind(this));

    // LiDAR layers (maplibre-gl-lidar)
    this.registerMethod('addLidarControl', this.handleAddLidarControl.bind(this));
    this.registerMethod('addLidarLayer', this.handleAddLidarLayer.bind(this));
    this.registerMethod('removeLidarLayer', this.handleRemoveLidarLayer.bind(this));
    this.registerMethod('setLidarColorScheme', this.handleSetLidarColorScheme.bind(this));
    this.registerMethod('setLidarPointSize', this.handleSetLidarPointSize.bind(this));
    this.registerMethod('setLidarOpacity', this.handleSetLidarOpacity.bind(this));

    // PMTiles layers
    this.registerMethod('addPMTilesLayer', this.handleAddPMTilesLayer.bind(this));
    this.registerMethod('removePMTilesLayer', this.handleRemovePMTilesLayer.bind(this));

    // maplibre-gl-components controls
    this.registerMethod('addPMTilesControl', this.handleAddPMTilesControl.bind(this));
    this.registerMethod('addCogControl', this.handleAddCogControl.bind(this));
    this.registerMethod('addZarrControl', this.handleAddZarrControl.bind(this));
    this.registerMethod('addVectorControl', this.handleAddVectorControl.bind(this));
    this.registerMethod('addControlGrid', this.handleAddControlGrid.bind(this));

    // Clustering
    this.registerMethod('addClusterLayer', this.handleAddClusterLayer.bind(this));
    this.registerMethod('removeClusterLayer', this.handleRemoveClusterLayer.bind(this));

    // Choropleth
    this.registerMethod('addChoropleth', this.handleAddChoropleth.bind(this));

    // 3D Buildings
    this.registerMethod('add3DBuildings', this.handleAdd3DBuildings.bind(this));

    // Route Animation
    this.registerMethod('animateAlongRoute', this.handleAnimateAlongRoute.bind(this));
    this.registerMethod('stopAnimation', this.handleStopAnimation.bind(this));
    this.registerMethod('pauseAnimation', this.handlePauseAnimation.bind(this));
    this.registerMethod('resumeAnimation', this.handleResumeAnimation.bind(this));
    this.registerMethod('setAnimationSpeed', this.handleSetAnimationSpeed.bind(this));

    // Feature Hover
    this.registerMethod('addHoverEffect', this.handleAddHoverEffect.bind(this));

    // Sky & Fog
    this.registerMethod('setSky', this.handleSetSky.bind(this));
    this.registerMethod('removeSky', this.handleRemoveSky.bind(this));

    // Feature Query/Filter
    this.registerMethod('setFilter', this.handleSetFilter.bind(this));
    this.registerMethod('queryRenderedFeatures', this.handleQueryRenderedFeatures.bind(this));
    this.registerMethod('querySourceFeatures', this.handleQuerySourceFeatures.bind(this));

    // Video Layer
    this.registerMethod('addVideoLayer', this.handleAddVideoLayer.bind(this));
    this.registerMethod('removeVideoLayer', this.handleRemoveVideoLayer.bind(this));
    this.registerMethod('playVideo', this.handlePlayVideo.bind(this));
    this.registerMethod('pauseVideo', this.handlePauseVideo.bind(this));
    this.registerMethod('seekVideo', this.handleSeekVideo.bind(this));

    // Split Map
    this.registerMethod('addSplitMap', this.handleAddSplitMap.bind(this));
    this.registerMethod('removeSplitMap', this.handleRemoveSplitMap.bind(this));

    // Colorbar
    this.registerMethod('addColorbar', this.handleAddColorbar.bind(this));
    this.registerMethod('removeColorbar', this.handleRemoveColorbar.bind(this));
    this.registerMethod('updateColorbar', this.handleUpdateColorbar.bind(this));

    // Search Control
    this.registerMethod('addSearchControl', this.handleAddSearchControl.bind(this));
    this.registerMethod('removeSearchControl', this.handleRemoveSearchControl.bind(this));

    // Measure Control
    this.registerMethod('addMeasureControl', this.handleAddMeasureControl.bind(this));
    this.registerMethod('removeMeasureControl', this.handleRemoveMeasureControl.bind(this));

    // Print Control
    this.registerMethod('addPrintControl', this.handleAddPrintControl.bind(this));
    this.registerMethod('removePrintControl', this.handleRemovePrintControl.bind(this));

    // GeoPhoto Control
    this.registerMethod('addGeoPhotoControl', this.handleAddGeoPhotoControl.bind(this));
    this.registerMethod('removeGeoPhotoControl', this.handleRemoveGeoPhotoControl.bind(this));
    this.registerMethod('loadGeoPhotoZip', this.handleLoadGeoPhotoZip.bind(this));
    this.registerMethod('loadGeoPhotoUrls', this.handleLoadGeoPhotoUrls.bind(this));
    this.registerMethod('geoPhotoSelectCamera', this.handleGeoPhotoSelectCamera.bind(this));
    this.registerMethod('geoPhotoNextCamera', this.handleGeoPhotoNextCamera.bind(this));
    this.registerMethod('geoPhotoPrevCamera', this.handleGeoPhotoPrevCamera.bind(this));
    this.registerMethod('geoPhotoPlay', this.handleGeoPhotoPlay.bind(this));
    this.registerMethod('geoPhotoStop', this.handleGeoPhotoStop.bind(this));
    this.registerMethod('geoPhotoClearData', this.handleGeoPhotoClearData.bind(this));

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
    const config = kwargs as unknown as LayerConfig;

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
    const beforeId = kwargs.beforeId as string | undefined;

    const sourceId = `basemap-${name}`;
    const layerId = `${name}`;

    // Add source if not exists
    if (!this.map.getSource(sourceId)) {
      const sourceConfig = {
        type: 'raster' as const,
        tiles: [url],
        tileSize: 256,
        attribution,
      };
      this.map.addSource(sourceId, sourceConfig);
      // Persist source state for multi-cell rendering
      this.stateManager.addSource(sourceId, sourceConfig as unknown as SourceConfig);
    }

    // Add layer, optionally before a specified layer
    if (!this.map.getLayer(layerId)) {
      const layerConfig = {
        id: layerId,
        type: 'raster' as const,
        source: sourceId,
      };
      this.map.addLayer(layerConfig, beforeId);
      // Persist layer state for multi-cell rendering
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

    // Add source
    if (!this.map.getSource(sourceId)) {
      const sourceConfig = {
        type: 'geojson' as const,
        data: geojson,
      };
      this.map.addSource(sourceId, sourceConfig);
      // Persist source state for multi-cell rendering
      this.stateManager.addSource(sourceId, sourceConfig as unknown as SourceConfig);
    }

    // Add layer
    if (!this.map.getLayer(layerId)) {
      const layerConfig = {
        id: layerId,
        type: type as maplibregl.LayerSpecification['type'],
        source: sourceId,
        paint: layerPaint,
      };
      this.map.addLayer(layerConfig as maplibregl.AddLayerObject);
      // Persist layer state for multi-cell rendering
      this.stateManager.addLayer(layerId, layerConfig as unknown as LayerConfig);
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
      const sourceConfig = {
        type: 'raster' as const,
        tiles: [url],
        tileSize: 256,
        attribution,
        minzoom: minZoom,
        maxzoom: maxZoom,
      };
      this.map.addSource(sourceId, sourceConfig);
      // Persist source state for multi-cell rendering
      this.stateManager.addSource(sourceId, sourceConfig as unknown as SourceConfig);
    }

    // Add layer
    if (!this.map.getLayer(layerId)) {
      const layerConfig = {
        id: layerId,
        type: 'raster' as const,
        source: sourceId,
        minzoom: minZoom,
        maxzoom: maxZoom,
      };
      this.map.addLayer(layerConfig);
      // Persist layer state for multi-cell rendering
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

    // Add image source
    if (!this.map.getSource(sourceId)) {
      this.map.addSource(sourceId, {
        type: 'image',
        url: url,
        coordinates: coordinates as [[number, number], [number, number], [number, number], [number, number]],
      });
    }

    // Add raster layer
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

    // Get layers from kwargs, or fall back to restored layers from model
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
    // Exclude internal/helper layers from the layer control by default
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

    // Create LiDAR adapter if LidarControl exists
    if (this.lidarControl) {
      this.lidarAdapter = new LidarLayerAdapter(this.lidarControl);
      customLayerAdapters.push(this.lidarAdapter);
    }

    // Create Marker adapter for DOM-based markers
    if (this.map) {
      this.markerAdapter = new MarkerLayerAdapter(this.map);
      // Register any marker groups added before the layer control
      this.markerGroupsMap.forEach((markers, groupId) => {
        this.markerAdapter!.addMarkerGroup(groupId, groupId, markers);
      });
      customLayerAdapters.push(this.markerAdapter);
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
      excludeLayers,
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

  // Helper to wrap popup/tooltip content with contrast-safe styling
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

    const marker = new Marker({ color, scale, draggable }).setLngLat([lng, lat]);

    if (popup) {
      marker.setPopup(new Popup({ maxWidth: popupMaxWidth }).setHTML(this.wrapWithContrastStyle(popup)));
    }

    // Add tooltip (shown on hover)
    if (tooltip) {
      const tooltipPopup = new Popup({
        closeButton: false,
        closeOnClick: false,
        maxWidth: tooltipMaxWidth,
        offset: [0, -30 * scale], // Offset above the marker based on scale
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
        // Check if we're moving to the popup itself
        const relatedTarget = e.relatedTarget as HTMLElement;
        if (relatedTarget?.closest('.maplibregl-popup')) {
          return;
        }
        isHovering = false;
        tooltipPopup.remove();
      });

      // Also handle leaving the popup
      tooltipPopup.on('close', () => {
        isHovering = false;
      });
    }

    marker.addTo(this.map);
    this.markersMap.set(id, marker);
    this.markerGroupsMap.set(id, [marker]);
    if (this.markerAdapter) {
      this.markerAdapter.addMarkerGroup(id, id, [marker]);
    }
  }

  private handleRemoveMarker(args: unknown[], kwargs: Record<string, unknown>): void {
    const [id] = args as [string];

    // Remove via group tracking (handles both single markers and marker groups)
    const group = this.markerGroupsMap.get(id);
    if (group) {
      for (const m of group) {
        m.remove();
      }
      this.markerGroupsMap.delete(id);
      // Clean up individual entries from markersMap
      if (this.markersMap.has(id)) {
        this.markersMap.delete(id);
      } else {
        const prefix = `${id}-`;
        const toDelete: string[] = [];
        this.markersMap.forEach((_, key) => {
          if (key.startsWith(prefix)) toDelete.push(key);
        });
        toDelete.forEach(key => this.markersMap.delete(key));
      }
    } else {
      // Fallback: direct marker lookup
      const marker = this.markersMap.get(id);
      if (marker) {
        marker.remove();
        this.markersMap.delete(id);
      }
    }

    if (this.markerAdapter) {
      this.markerAdapter.removeMarkerGroup(id);
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

    const groupMarkers: Marker[] = [];

    for (let i = 0; i < markers.length; i++) {
      const markerData = markers[i];
      const markerId = `${id}-${i}`;
      const scale = markerData.scale ?? defaultScale;
      const popupMaxWidth = markerData.popupMaxWidth || defaultPopupMaxWidth;
      const tooltipMaxWidth = markerData.tooltipMaxWidth || defaultTooltipMaxWidth;

      const marker = new Marker({ color, scale, draggable }).setLngLat(markerData.lngLat);

      if (markerData.popup) {
        marker.setPopup(new Popup({ maxWidth: popupMaxWidth }).setHTML(this.wrapWithContrastStyle(markerData.popup)));
      }

      // Add tooltip (shown on hover)
      if (markerData.tooltip) {
        const tooltipPopup = new Popup({
          closeButton: false,
          closeOnClick: false,
          maxWidth: tooltipMaxWidth,
          offset: [0, -30 * scale], // Offset above the marker based on scale
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
          // Check if we're moving to the popup itself
          const relatedTarget = e.relatedTarget as HTMLElement;
          if (relatedTarget?.closest('.maplibregl-popup')) {
            return;
          }
          isHovering = false;
          tooltipPopup.remove();
        });

        // Also handle leaving the popup
        tooltipPopup.on('close', () => {
          isHovering = false;
        });
      }

      marker.addTo(this.map);
      this.markersMap.set(markerId, marker);
      groupMarkers.push(marker);
    }

    this.markerGroupsMap.set(id, groupMarkers);
    if (this.markerAdapter) {
      this.markerAdapter.addMarkerGroup(id, id, groupMarkers);
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

    // Add click handler for the layer
    this.map.on('click', layerId, (e) => {
      if (!e.features || e.features.length === 0) return;
      const feature = e.features[0];
      const props = feature.properties || {};

      // CSS styles for better contrast and readability
      const tableStyle =
        'border-collapse: collapse; font-size: 13px; color: #333;';
      const cellStyle =
        'padding: 4px 8px; border-bottom: 1px solid #ddd; color: #333;';
      const keyStyle = 'font-weight: 600; color: #222;';
      const valueStyle = 'color: #444;';

      // Base style for custom templates
      const containerStyle =
        'font-size: 13px; color: #333; line-height: 1.4;';
      const templateStyles = `
        <style>
          .anymap-popup h1, .anymap-popup h2, .anymap-popup h3, .anymap-popup h4 { color: #222; margin: 0 0 8px 0; }
          .anymap-popup p { color: #444; margin: 4px 0; }
        </style>
      `;

      let content: string;
      if (template) {
        // Replace placeholders in template and wrap with styled container
        const replaced = template.replace(/\{(\w+)\}/g, (match, key) => {
          return props[key] !== undefined ? String(props[key]) : match;
        });
        content = `${templateStyles}<div class="anymap-popup" style="${containerStyle}">${replaced}</div>`;
      } else if (properties) {
        // Build table from specified properties
        const rows = properties
          .filter((key) => props[key] !== undefined)
          .map(
            (key) =>
              `<tr><td style="${cellStyle} ${keyStyle}">${key}</td><td style="${cellStyle} ${valueStyle}">${props[key]}</td></tr>`
          )
          .join('');
        content = `<table style="${tableStyle}">${rows}</table>`;
      } else {
        // Show all properties
        const rows = Object.entries(props)
          .map(
            ([key, value]) =>
              `<tr><td style="${cellStyle} ${keyStyle}">${key}</td><td style="${cellStyle} ${valueStyle}">${value}</td></tr>`
          )
          .join('');
        content = `<table style="${tableStyle}">${rows}</table>`;
      }

      new Popup()
        .setLngLat(e.lngLat)
        .setHTML(content)
        .addTo(this.map!);
    });

    // Change cursor on hover
    this.map.on('mouseenter', layerId, () => {
      if (this.map) this.map.getCanvas().style.cursor = 'pointer';
    });
    this.map.on('mouseleave', layerId, () => {
      if (this.map) this.map.getCanvas().style.cursor = '';
    });
  }

  private handleAddLegend(args: unknown[], kwargs: Record<string, unknown>): void {
    if (!this.map) return;
    const legendId = (kwargs.id as string) || `legend-${Date.now()}`;
    const title = (kwargs.title as string) || 'Legend';
    const items = kwargs.items as Array<{ label: string; color: string }> || [];
    const position = (kwargs.position as string) || 'bottom-right';
    const opacity = (kwargs.opacity as number) ?? 1.0;

    // Remove existing legend with the same ID
    if (this.legendsMap.has(legendId)) {
      this.handleRemoveLegend([legendId], {});
    }

    // Create legend container
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

    // Add title
    const titleEl = document.createElement('div');
    titleEl.style.cssText = 'font-weight: bold; margin-bottom: 8px; font-size: 13px; color: #333;';
    titleEl.textContent = title;
    legendDiv.appendChild(titleEl);

    // Add items
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

    // Get the appropriate control container
    const container = this.map.getContainer();
    const positionClass = `maplibregl-ctrl-${position}`;
    let controlContainer = container.querySelector(`.${positionClass}`) as HTMLElement;
    if (!controlContainer) {
      // Create container if it doesn't exist
      const controlWrapper = container.querySelector('.maplibregl-control-container');
      if (controlWrapper) {
        controlContainer = document.createElement('div');
        controlContainer.className = `maplibregl-ctrl-${position.split('-')[0]} ${positionClass}`;
        controlWrapper.appendChild(controlContainer);
      }
    }
    if (controlContainer) {
      // Insert at beginning so legend appears above attribution
      controlContainer.insertBefore(legendDiv, controlContainer.firstChild);
    }

    this.legendsMap.set(legendId, legendDiv);
  }

  private handleRemoveLegend(args: unknown[], kwargs: Record<string, unknown>): void {
    const legendId = args[0] as string | undefined;

    if (legendId) {
      // Remove specific legend
      const legendDiv = this.legendsMap.get(legendId);
      if (legendDiv && legendDiv.parentNode) {
        legendDiv.parentNode.removeChild(legendDiv);
      }
      this.legendsMap.delete(legendId);
    } else {
      // Remove all legends
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

    // Add terrain source
    if (!this.map.getSource(sourceId)) {
      this.map.addSource(sourceId, {
        type: 'raster-dem',
        tiles: [source.url],
        tileSize: 256,
        encoding: source.encoding === 'mapbox' ? 'mapbox' : 'terrarium',
      });
    }

    // Enable terrain
    this.map.setTerrain({
      source: sourceId,
      exaggeration: exaggeration,
    });
  }

  private handleMoveLayer(args: unknown[], kwargs: Record<string, unknown>): void {
    if (!this.map) return;
    const [layerId, beforeId] = args as [string, string | undefined];

    if (!layerId) {
      console.error('moveLayer requires layerId');
      return;
    }

    if (this.map.getLayer(layerId)) {
      this.map.moveLayer(layerId, beforeId || undefined);
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
      const layers = Array.from(this.deckLayers.values()) as (false | null | undefined)[];
      this.deckOverlay.setProps({ layers });
    }
  }

  protected handleAddCOGLayer(args: unknown[], kwargs: Record<string, unknown>): void {
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
    } as unknown as Record<string, unknown>);

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
    const selector = kwargs.selector || {};
    const opacity = kwargs.opacity as number ?? 1;

    const layer = new ZarrLayer({
      id,
      source,
      variable,
      clim,
      colormap,
      selector: selector as any,
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

  protected handleAddArcLayer(args: unknown[], kwargs: Record<string, unknown>): void {
    if (!this.map) return;

    // Initialize deck.gl overlay if needed
    this.initializeDeckOverlay();

    const id = kwargs.id as string || `arc-${Date.now()}`;
    const data = kwargs.data as unknown[];

    // Helper to create accessor from string or use value directly
    const makeAccessor = (value: unknown, defaultProp: string, fallbackFn?: (d: any) => any): any => {
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

  protected handleAddPointCloudLayer(args: unknown[], kwargs: Record<string, unknown>): void {
    if (!this.map) return;

    // Initialize deck.gl overlay if needed
    this.initializeDeckOverlay();

    const id = kwargs.id as string || `pointcloud-${Date.now()}`;
    const data = kwargs.data as unknown[];

    // Helper to create accessor from string or use value directly
    const makeAccessor = (value: unknown, defaultProp: string, fallbackFn?: (d: any) => any): any => {
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

  protected handleAddScatterplotLayer(args: unknown[], kwargs: Record<string, unknown>): void {
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
    } as any);

    this.deckLayers.set(id, layer);
    this.updateDeckOverlay();

    if (this.deckLayerAdapter) {
      this.deckLayerAdapter.notifyLayerAdded(id);
    }
  }

  protected handleAddPathLayer(args: unknown[], kwargs: Record<string, unknown>): void {
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
    } as any);

    this.deckLayers.set(id, layer);
    this.updateDeckOverlay();

    if (this.deckLayerAdapter) {
      this.deckLayerAdapter.notifyLayerAdded(id);
    }
  }

  protected handleAddPolygonLayer(args: unknown[], kwargs: Record<string, unknown>): void {
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
    } as any);

    this.deckLayers.set(id, layer);
    this.updateDeckOverlay();

    if (this.deckLayerAdapter) {
      this.deckLayerAdapter.notifyLayerAdded(id);
    }
  }

  protected handleAddHexagonLayer(args: unknown[], kwargs: Record<string, unknown>): void {
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
      colorRange: kwargs.colorRange ?? [
        [1, 152, 189],
        [73, 227, 206],
        [216, 254, 181],
        [254, 237, 177],
        [254, 173, 84],
        [209, 55, 78],
      ],
    } as any);

    this.deckLayers.set(id, layer);
    this.updateDeckOverlay();

    if (this.deckLayerAdapter) {
      this.deckLayerAdapter.notifyLayerAdded(id);
    }
  }

  protected handleAddHeatmapLayer(args: unknown[], kwargs: Record<string, unknown>): void {
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
      colorRange: (kwargs.colorRange ?? [
        [255, 255, 178, 25],
        [254, 217, 118, 85],
        [254, 178, 76, 127],
        [253, 141, 60, 170],
        [240, 59, 32, 212],
        [189, 0, 38, 255],
      ]) as any,
    } as any);

    this.deckLayers.set(id, layer);
    this.updateDeckOverlay();

    if (this.deckLayerAdapter) {
      this.deckLayerAdapter.notifyLayerAdded(id);
    }
  }

  protected handleAddGridLayer(args: unknown[], kwargs: Record<string, unknown>): void {
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
      colorRange: kwargs.colorRange ?? [
        [1, 152, 189],
        [73, 227, 206],
        [216, 254, 181],
        [254, 237, 177],
        [254, 173, 84],
        [209, 55, 78],
      ],
    } as any);

    this.deckLayers.set(id, layer);
    this.updateDeckOverlay();

    if (this.deckLayerAdapter) {
      this.deckLayerAdapter.notifyLayerAdded(id);
    }
  }

  protected handleAddIconLayer(args: unknown[], kwargs: Record<string, unknown>): void {
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
      iconMapping: kwargs.iconMapping,
      getPosition: kwargs.getPosition ?? ((d: any) => d.coordinates || d.position || [d.lng || d.longitude, d.lat || d.latitude]),
      getIcon: kwargs.getIcon ?? ((d: any) => d.icon || 'marker'),
      getSize: kwargs.getSize ?? kwargs.size ?? 20,
      getColor: kwargs.getColor ?? kwargs.color ?? [255, 255, 255, 255],
    } as any);

    this.deckLayers.set(id, layer);
    this.updateDeckOverlay();

    if (this.deckLayerAdapter) {
      this.deckLayerAdapter.notifyLayerAdded(id);
    }
  }

  protected handleAddTextLayer(args: unknown[], kwargs: Record<string, unknown>): void {
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
    } as any);

    this.deckLayers.set(id, layer);
    this.updateDeckOverlay();

    if (this.deckLayerAdapter) {
      this.deckLayerAdapter.notifyLayerAdded(id);
    }
  }

  protected handleAddGeoJsonLayer(args: unknown[], kwargs: Record<string, unknown>): void {
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
    } as any);

    this.deckLayers.set(id, layer);
    this.updateDeckOverlay();

    if (this.deckLayerAdapter) {
      this.deckLayerAdapter.notifyLayerAdded(id);
    }
  }

  protected handleAddContourLayer(args: unknown[], kwargs: Record<string, unknown>): void {
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
    } as any);

    this.deckLayers.set(id, layer);
    this.updateDeckOverlay();

    if (this.deckLayerAdapter) {
      this.deckLayerAdapter.notifyLayerAdded(id);
    }
  }

  protected handleAddScreenGridLayer(args: unknown[], kwargs: Record<string, unknown>): void {
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
      colorRange: (kwargs.colorRange ?? [
        [255, 255, 178, 25],
        [254, 217, 118, 85],
        [254, 178, 76, 127],
        [253, 141, 60, 170],
        [240, 59, 32, 212],
        [189, 0, 38, 255],
      ]) as any,
    } as any);

    this.deckLayers.set(id, layer);
    this.updateDeckOverlay();

    if (this.deckLayerAdapter) {
      this.deckLayerAdapter.notifyLayerAdded(id);
    }
  }

  protected handleAddTripsLayer(args: unknown[], kwargs: Record<string, unknown>): void {
    if (!this.map) return;
    this.initializeDeckOverlay();

    const id = kwargs.id as string || `trips-${Date.now()}`;
    const data = kwargs.data as unknown[];

    // Helper to create accessor from string or use value directly
    const makeAccessor = (value: unknown, defaultProp: string, fallbackFn?: (d: any) => any): any => {
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
    } as any);

    this.deckLayers.set(id, layer);
    this.updateDeckOverlay();

    if (this.deckLayerAdapter) {
      this.deckLayerAdapter.notifyLayerAdded(id);
    }
  }

  protected handleAddLineLayer(args: unknown[], kwargs: Record<string, unknown>): void {
    if (!this.map) return;
    this.initializeDeckOverlay();

    const id = kwargs.id as string || `line-${Date.now()}`;
    const data = kwargs.data as unknown[];

    // Helper to create accessor from string or use value directly
    const makeAccessor = (value: unknown, defaultProp: string, fallbackFn?: (d: any) => any): any => {
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
    } as any);

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
  protected handleAddDeckGLLayer(args: unknown[], kwargs: Record<string, unknown>): void {
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
      'BitmapLayer': this.handleAddBitmapLayer.bind(this),
      'ColumnLayer': this.handleAddColumnLayer.bind(this),
      'GridCellLayer': this.handleAddGridCellLayer.bind(this),
      'SolidPolygonLayer': this.handleAddSolidPolygonLayer.bind(this),
      // Heavy geo-layers and mesh-layers are only in DeckGLRenderer
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
  protected handleRemoveDeckLayer(args: unknown[], kwargs: Record<string, unknown>): void {
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
  protected handleSetDeckLayerVisibility(args: unknown[], kwargs: Record<string, unknown>): void {
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
  // Accessor helper for deck.gl layer properties
  // -------------------------------------------------------------------------

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  protected makeDeckAccessor(value: unknown, defaultProp: string, fallbackFn?: (d: any) => any): any {
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
  }

  // -------------------------------------------------------------------------
  // Additional deck.gl layer handlers
  // -------------------------------------------------------------------------

  protected handleAddBitmapLayer(args: unknown[], kwargs: Record<string, unknown>): void {
    if (!this.map) return;
    this.initializeDeckOverlay();

    const id = kwargs.id as string || `bitmap-${Date.now()}`;
    const image = kwargs.image as string;
    const bounds = kwargs.bounds as [number, number, number, number];

    const layer = new BitmapLayer({
      id,
      image,
      bounds,
      opacity: kwargs.opacity as number ?? 1,
      visible: kwargs.visible !== false,
      pickable: kwargs.pickable as boolean ?? false,
      desaturate: kwargs.desaturate as number ?? 0,
      transparentColor: (kwargs.transparentColor ?? [0, 0, 0, 0]) as any,
      tintColor: (kwargs.tintColor ?? [255, 255, 255]) as any,
    });

    this.deckLayers.set(id, layer);
    this.updateDeckOverlay();

    if (this.deckLayerAdapter) {
      this.deckLayerAdapter.notifyLayerAdded(id);
    }
  }

  protected handleAddColumnLayer(args: unknown[], kwargs: Record<string, unknown>): void {
    if (!this.map) return;
    this.initializeDeckOverlay();

    const id = kwargs.id as string || `column-${Date.now()}`;
    const data = kwargs.data as unknown[];

    const layer = new ColumnLayer({
      id,
      data,
      pickable: kwargs.pickable !== false,
      opacity: kwargs.opacity as number ?? 0.8,
      extruded: kwargs.extruded as boolean ?? true,
      diskResolution: kwargs.diskResolution as number ?? 20,
      radius: kwargs.radius as number ?? 1000,
      elevationScale: kwargs.elevationScale as number ?? 1,
      coverage: kwargs.coverage as number ?? 1,
      filled: kwargs.filled !== false,
      stroked: kwargs.stroked as boolean ?? false,
      wireframe: kwargs.wireframe as boolean ?? false,
      getPosition: this.makeDeckAccessor(
        kwargs.getPosition, 'coordinates',
        (d: any) => d.coordinates || d.position || [d.lng || d.longitude, d.lat || d.latitude],
      ),
      getFillColor: this.makeDeckAccessor(kwargs.getFillColor ?? kwargs.fillColor, 'fillColor', () => [255, 140, 0, 200]),
      getLineColor: this.makeDeckAccessor(kwargs.getLineColor ?? kwargs.lineColor, 'lineColor', () => [0, 0, 0, 255]),
      getElevation: this.makeDeckAccessor(kwargs.getElevation ?? kwargs.elevation, 'elevation', () => 1000),
    } as any);

    this.deckLayers.set(id, layer);
    this.updateDeckOverlay();

    if (this.deckLayerAdapter) {
      this.deckLayerAdapter.notifyLayerAdded(id);
    }
  }

  protected handleAddGridCellLayer(args: unknown[], kwargs: Record<string, unknown>): void {
    if (!this.map) return;
    this.initializeDeckOverlay();

    const id = kwargs.id as string || `gridcell-${Date.now()}`;
    const data = kwargs.data as unknown[];

    const layer = new GridCellLayer({
      id,
      data,
      pickable: kwargs.pickable !== false,
      opacity: kwargs.opacity as number ?? 0.8,
      extruded: kwargs.extruded as boolean ?? true,
      cellSize: kwargs.cellSize as number ?? 200,
      elevationScale: kwargs.elevationScale as number ?? 1,
      coverage: kwargs.coverage as number ?? 1,
      getPosition: this.makeDeckAccessor(
        kwargs.getPosition, 'coordinates',
        (d: any) => d.coordinates || d.position || [d.lng || d.longitude, d.lat || d.latitude],
      ),
      getColor: this.makeDeckAccessor(kwargs.getColor ?? kwargs.color, 'color', () => [255, 140, 0, 200]),
      getElevation: this.makeDeckAccessor(kwargs.getElevation ?? kwargs.elevation, 'elevation', () => 1000),
    } as any);

    this.deckLayers.set(id, layer);
    this.updateDeckOverlay();

    if (this.deckLayerAdapter) {
      this.deckLayerAdapter.notifyLayerAdded(id);
    }
  }

  protected handleAddSolidPolygonLayer(args: unknown[], kwargs: Record<string, unknown>): void {
    if (!this.map) return;
    this.initializeDeckOverlay();

    const id = kwargs.id as string || `solidpolygon-${Date.now()}`;
    const data = kwargs.data as unknown[];

    const layer = new SolidPolygonLayer({
      id,
      data,
      pickable: kwargs.pickable !== false,
      opacity: kwargs.opacity as number ?? 0.8,
      filled: kwargs.filled !== false,
      extruded: kwargs.extruded as boolean ?? false,
      wireframe: kwargs.wireframe as boolean ?? false,
      elevationScale: kwargs.elevationScale as number ?? 1,
      getPolygon: this.makeDeckAccessor(kwargs.getPolygon, 'polygon', (d: any) => d.polygon || d.contour || d.coordinates),
      getFillColor: this.makeDeckAccessor(kwargs.getFillColor ?? kwargs.fillColor, 'fillColor', () => [51, 136, 255, 128]),
      getLineColor: this.makeDeckAccessor(kwargs.getLineColor ?? kwargs.lineColor, 'lineColor', () => [0, 0, 0, 255]),
      getElevation: this.makeDeckAccessor(kwargs.getElevation ?? kwargs.elevation, 'elevation', () => 0),
    } as any);

    this.deckLayers.set(id, layer);
    this.updateDeckOverlay();

    if (this.deckLayerAdapter) {
      this.deckLayerAdapter.notifyLayerAdded(id);
    }
  }

  // Heavy geo-layers (TileLayer, MVTLayer, Tile3DLayer, TerrainLayer, GreatCircleLayer,
  // H3HexagonLayer, H3ClusterLayer, S2Layer, QuadkeyLayer, GeohashLayer, WMSLayer)
  // and mesh-layers (SimpleMeshLayer, ScenegraphLayer) handlers are only in DeckGLRenderer
  // to keep the maplibre.js bundle lightweight and avoid heavy CommonJS dependencies.

  // Heavy geo-layers and mesh-layers handlers removed - see DeckGLRenderer

  // -------------------------------------------------------------------------
  // Native MapLibre feature handlers (Section 3)
  // -------------------------------------------------------------------------

  protected handleSetProjection(args: unknown[], kwargs: Record<string, unknown>): void {
    if (!this.map) return;
    const projection = (kwargs.projection as string) || (args[0] as string) || 'mercator';
    try {
      this.map.setProjection({ type: projection } as maplibregl.ProjectionSpecification);
    } catch (err) {
      console.error('setProjection error:', err);
    }
  }

  protected handleUpdateGeoJSONSource(args: unknown[], kwargs: Record<string, unknown>): void {
    if (!this.map) return;
    const sourceId = kwargs.sourceId as string || args[0] as string;
    const data = kwargs.data;
    if (!sourceId) return;

    let source = this.map.getSource(sourceId) as maplibregl.GeoJSONSource;
    if (!source && !sourceId.endsWith('-source')) {
      source = this.map.getSource(sourceId + '-source') as maplibregl.GeoJSONSource;
    }
    if (source && typeof source.setData === 'function') {
      source.setData(data as any);
    }
  }

  protected handleAddMapImage(args: unknown[], kwargs: Record<string, unknown>): void {
    if (!this.map) return;
    const name = kwargs.name as string || args[0] as string;
    const url = kwargs.url as string || args[1] as string;
    if (!name || !url) return;

    this.map.loadImage(url).then((response) => {
      if (response && response.data && !this.map!.hasImage(name)) {
        this.map!.addImage(name, response.data);
      }
    }).catch((err) => {
      console.warn(`Failed to load image '${name}':`, err);
    });
  }

  private tooltipPopup: maplibregl.Popup | null = null;
  private tooltipLayerHandlers: Map<string, (e: any) => void> = new Map();

  protected handleAddTooltip(args: unknown[], kwargs: Record<string, unknown>): void {
    if (!this.map) return;
    const layerId = kwargs.layerId as string;
    const template = kwargs.template as string || '';
    const properties = kwargs.properties as string[] | undefined;
    if (!layerId) return;

    // Remove existing tooltip for this layer
    if (this.tooltipLayerHandlers.has(layerId)) {
      const oldHandler = this.tooltipLayerHandlers.get(layerId)!;
      this.map.off('mousemove', layerId, oldHandler);
      this.tooltipLayerHandlers.delete(layerId);
    }

    const popup = new Popup({
      closeButton: false,
      closeOnClick: false,
      className: 'anymap-tooltip',
    });

    const handler = (e: any) => {
      if (!e.features || e.features.length === 0) {
        popup.remove();
        return;
      }

      const feature = e.features[0];
      const props = feature.properties || {};
      let html = template;

      if (template) {
        // Replace {property} placeholders and wrap in styled container
        const content = template.replace(/\{(\w+)\}/g, (_: string, key: string) => {
          return props[key] !== undefined ? String(props[key]) : '';
        });
        html = '<div style="font-size:12px;color:#333">' + content + '</div>';
      } else if (properties && properties.length > 0) {
        // Show only specified properties
        html = '<div style="font-size:12px;color:#333">' +
          properties.map(p => `<b>${p}:</b> ${props[p] !== undefined ? props[p] : 'N/A'}`).join('<br>') +
          '</div>';
      } else {
        // Show all properties
        html = '<div style="font-size:12px;color:#333">' +
          Object.entries(props).map(([k, v]) => `<b>${k}:</b> ${v}`).join('<br>') +
          '</div>';
      }

      popup.setLngLat(e.lngLat).setHTML(html).addTo(this.map!);
    };

    this.map.on('mousemove', layerId, handler);
    this.map.on('mouseleave', layerId, () => { popup.remove(); });
    this.tooltipLayerHandlers.set(layerId, handler);
  }

  protected handleRemoveTooltip(args: unknown[], kwargs: Record<string, unknown>): void {
    if (!this.map) return;
    const layerId = kwargs.layerId as string;
    if (!layerId) return;

    if (this.tooltipLayerHandlers.has(layerId)) {
      const handler = this.tooltipLayerHandlers.get(layerId)!;
      this.map.off('mousemove', layerId, handler);
      this.tooltipLayerHandlers.delete(layerId);
    }
  }

  private coordinatesControl: HTMLDivElement | null = null;
  private coordinatesHandler: ((e: any) => void) | null = null;

  protected handleAddCoordinatesControl(args: unknown[], kwargs: Record<string, unknown>): void {
    if (!this.map) return;
    const position = kwargs.position as string || 'bottom-left';

    // Remove existing
    if (this.coordinatesControl) {
      this.coordinatesControl.remove();
      if (this.coordinatesHandler) {
        this.map.off('mousemove', this.coordinatesHandler);
      }
    }

    const div = document.createElement('div');
    div.className = 'maplibregl-ctrl maplibregl-ctrl-group anymap-coordinates';
    div.style.cssText = 'padding:4px 8px;font-size:11px;font-family:monospace;background:rgba(255,255,255,0.9);pointer-events:none;';
    div.textContent = 'Lng: 0.0000, Lat: 0.0000';

    const precision = kwargs.precision as number ?? 4;

    const handler = (e: any) => {
      div.textContent = `Lng: ${e.lngLat.lng.toFixed(precision)}, Lat: ${e.lngLat.lat.toFixed(precision)}`;
    };

    this.map.on('mousemove', handler);
    this.coordinatesHandler = handler;

    // Add to map container
    const controlContainer = this.map.getContainer().querySelector(`.maplibregl-ctrl-${position}`);
    if (controlContainer) {
      controlContainer.appendChild(div);
    } else {
      this.map.getContainer().appendChild(div);
    }
    this.coordinatesControl = div;
  }

  protected handleRemoveCoordinatesControl(args: unknown[], kwargs: Record<string, unknown>): void {
    if (!this.map) return;
    if (this.coordinatesControl) {
      this.coordinatesControl.remove();
      this.coordinatesControl = null;
    }
    if (this.coordinatesHandler) {
      this.map.off('mousemove', this.coordinatesHandler);
      this.coordinatesHandler = null;
    }
  }

  // -------------------------------------------------------------------------
  // Time Slider handler (Section 4)
  // -------------------------------------------------------------------------

  private timeSliderContainer: HTMLDivElement | null = null;

  protected handleAddTimeSlider(args: unknown[], kwargs: Record<string, unknown>): void {
    if (!this.map) return;
    const layerId = kwargs.layerId as string;
    const property = kwargs.property as string;
    const min = kwargs.min as number ?? 0;
    const max = kwargs.max as number ?? 100;
    const step = kwargs.step as number ?? 1;
    const position = kwargs.position as string || 'bottom-left';
    const label = kwargs.label as string || 'Time';
    const autoPlay = kwargs.autoPlay as boolean ?? false;
    const interval = kwargs.interval as number ?? 500;

    // Remove existing slider
    this.handleRemoveTimeSlider(args, kwargs);

    const container = document.createElement('div');
    container.className = 'maplibregl-ctrl maplibregl-ctrl-group anymap-time-slider';
    container.style.cssText = 'padding:10px;background:rgba(255,255,255,0.95);min-width:250px;border-radius:4px;';

    const labelEl = document.createElement('div');
    labelEl.style.cssText = 'font-size:12px;font-weight:bold;margin-bottom:5px;';
    labelEl.textContent = `${label}: ${min}`;

    const slider = document.createElement('input');
    slider.type = 'range';
    slider.min = String(min);
    slider.max = String(max);
    slider.step = String(step);
    slider.value = String(min);
    slider.style.cssText = 'width:100%;cursor:pointer;';

    const playBtn = document.createElement('button');
    playBtn.textContent = '\u25B6';
    playBtn.style.cssText = 'margin-top:5px;padding:2px 8px;cursor:pointer;border:1px solid #ccc;border-radius:3px;background:#fff;';

    let animTimer: number | null = null;

    const updateFilter = (value: number) => {
      labelEl.textContent = `${label}: ${value}`;
      if (this.map && layerId && property) {
        this.map.setFilter(layerId, ['<=', property, value]);
      }
    };

    slider.addEventListener('input', () => {
      updateFilter(Number(slider.value));
    });

    const stopAnim = () => {
      if (animTimer !== null) {
        clearInterval(animTimer);
        animTimer = null;
        playBtn.textContent = '\u25B6';
      }
    };

    playBtn.addEventListener('click', () => {
      if (animTimer !== null) {
        stopAnim();
      } else {
        playBtn.textContent = '\u23F8';
        animTimer = window.setInterval(() => {
          let val = Number(slider.value) + step;
          if (val > max) val = min;
          slider.value = String(val);
          updateFilter(val);
        }, interval);
      }
    });

    container.appendChild(labelEl);
    container.appendChild(slider);
    container.appendChild(playBtn);

    const controlContainer = this.map.getContainer().querySelector(`.maplibregl-ctrl-${position}`);
    if (controlContainer) {
      controlContainer.appendChild(container);
    } else {
      this.map.getContainer().appendChild(container);
    }
    this.timeSliderContainer = container;

    if (autoPlay) {
      playBtn.click();
    }
  }

  protected handleRemoveTimeSlider(args: unknown[], kwargs: Record<string, unknown>): void {
    if (this.timeSliderContainer) {
      this.timeSliderContainer.remove();
      this.timeSliderContainer = null;
    }
  }

  // -------------------------------------------------------------------------
  // UI Enhancement handlers (Section 6)
  // -------------------------------------------------------------------------

  private swipeContainer: HTMLDivElement | null = null;
  private swipeHandler: (() => void) | null = null;

  protected handleAddSwipeMap(args: unknown[], kwargs: Record<string, unknown>): void {
    if (!this.map) return;
    const leftLayer = kwargs.leftLayer as string;
    const rightLayer = kwargs.rightLayer as string;
    if (!leftLayer || !rightLayer) return;

    // Remove existing
    this.handleRemoveSwipeMap(args, kwargs);

    const container = this.map.getContainer();
    const slider = document.createElement('div');
    slider.className = 'anymap-swipe-slider';
    slider.style.cssText = 'position:absolute;top:0;bottom:0;width:4px;background:#fff;cursor:ew-resize;z-index:10;left:50%;box-shadow:0 0 4px rgba(0,0,0,0.3);';

    const handle = document.createElement('div');
    handle.style.cssText = 'position:absolute;top:50%;left:-10px;width:24px;height:24px;background:#fff;border-radius:50%;border:2px solid #333;transform:translateY(-50%);cursor:ew-resize;';
    slider.appendChild(handle);
    container.appendChild(slider);

    let isDragging = false;

    const updateClip = () => {
      const rect = container.getBoundingClientRect();
      const sliderLeft = slider.offsetLeft;
      const clipRight = rect.width - sliderLeft;

      // Clip the right layer to show only on the right side of the slider
      this.map!.getContainer();
      // Use clip-path on canvas layers
      const mapCanvas = this.map!.getCanvas();
      if (mapCanvas) {
        // Set the left layer to show fully, clip the right layer
        if (this.map!.getLayer(leftLayer)) {
          // Left layer is fully visible
        }
        if (this.map!.getLayer(rightLayer)) {
          this.map!.setPaintProperty(rightLayer, 'raster-opacity', 1);
        }
      }
    };

    const onMouseDown = (e: MouseEvent) => {
      isDragging = true;
      e.preventDefault();
    };

    const onMouseMove = (e: MouseEvent) => {
      if (!isDragging) return;
      const rect = container.getBoundingClientRect();
      const x = Math.max(0, Math.min(e.clientX - rect.left, rect.width));
      slider.style.left = `${x}px`;

      // Clip left layer
      if (this.map!.getLayer(leftLayer)) {
        (this.map! as any).setLayerClipBounds?.(leftLayer, [[0, 0], [x, rect.height]]);
      }
      if (this.map!.getLayer(rightLayer)) {
        (this.map! as any).setLayerClipBounds?.(rightLayer, [[x, 0], [rect.width, rect.height]]);
      }
    };

    const onMouseUp = () => { isDragging = false; };

    slider.addEventListener('mousedown', onMouseDown);
    document.addEventListener('mousemove', onMouseMove);
    document.addEventListener('mouseup', onMouseUp);

    this.swipeContainer = slider;
    this.swipeHandler = () => {
      slider.removeEventListener('mousedown', onMouseDown);
      document.removeEventListener('mousemove', onMouseMove);
      document.removeEventListener('mouseup', onMouseUp);
    };
  }

  protected handleRemoveSwipeMap(args: unknown[], kwargs: Record<string, unknown>): void {
    if (this.swipeContainer) {
      this.swipeContainer.remove();
      this.swipeContainer = null;
    }
    if (this.swipeHandler) {
      this.swipeHandler();
      this.swipeHandler = null;
    }
  }

  private opacitySliderContainer: Map<string, HTMLDivElement> = new Map();

  protected handleAddOpacitySlider(args: unknown[], kwargs: Record<string, unknown>): void {
    if (!this.map) return;
    const layerId = kwargs.layerId as string;
    const position = kwargs.position as string || 'top-right';
    const label = kwargs.label as string || layerId;
    if (!layerId) return;

    // Remove existing for this layer
    this.removeOpacitySliderForLayer(layerId);

    const container = document.createElement('div');
    container.className = 'maplibregl-ctrl maplibregl-ctrl-group anymap-opacity-slider';
    container.style.cssText = 'padding:8px;background:rgba(255,255,255,0.95);min-width:150px;border-radius:4px;';

    const labelEl = document.createElement('div');
    labelEl.style.cssText = 'font-size:11px;margin-bottom:4px;';
    labelEl.textContent = `${label}: 100%`;

    const slider = document.createElement('input');
    slider.type = 'range';
    slider.min = '0';
    slider.max = '100';
    slider.value = '100';
    slider.style.cssText = 'width:100%;cursor:pointer;';

    slider.addEventListener('input', () => {
      const opacity = Number(slider.value) / 100;
      labelEl.textContent = `${label}: ${slider.value}%`;

      // Try to set opacity on different layer types
      if (this.map!.getLayer(layerId)) {
        try {
          const layerObj = this.map!.getLayer(layerId);
          const layerType = (layerObj as any)?.type;
          if (layerType === 'raster') {
            this.map!.setPaintProperty(layerId, 'raster-opacity', opacity);
          } else if (layerType === 'fill') {
            this.map!.setPaintProperty(layerId, 'fill-opacity', opacity);
          } else if (layerType === 'line') {
            this.map!.setPaintProperty(layerId, 'line-opacity', opacity);
          } else if (layerType === 'circle') {
            this.map!.setPaintProperty(layerId, 'circle-opacity', opacity);
          } else if (layerType === 'symbol') {
            this.map!.setPaintProperty(layerId, 'icon-opacity', opacity);
            this.map!.setPaintProperty(layerId, 'text-opacity', opacity);
          } else if (layerType === 'fill-extrusion') {
            this.map!.setPaintProperty(layerId, 'fill-extrusion-opacity', opacity);
          }
        } catch {
          // Deck.gl layer - try deck.gl approach
          const deckLayer = this.deckLayers.get(layerId) as { clone?: (props: Record<string, unknown>) => unknown } | undefined;
          if (deckLayer && typeof deckLayer.clone === 'function') {
            const updated = deckLayer.clone({ opacity });
            this.deckLayers.set(layerId, updated);
            this.updateDeckOverlay();
          }
        }
      }
    });

    container.appendChild(labelEl);
    container.appendChild(slider);

    const controlContainer = this.map.getContainer().querySelector(`.maplibregl-ctrl-${position}`);
    if (controlContainer) {
      controlContainer.appendChild(container);
    }

    this.opacitySliderContainer.set(layerId, container);
  }

  private removeOpacitySliderForLayer(layerId: string): void {
    const existing = this.opacitySliderContainer.get(layerId);
    if (existing) {
      existing.remove();
      this.opacitySliderContainer.delete(layerId);
    }
  }

  protected handleRemoveOpacitySlider(args: unknown[], kwargs: Record<string, unknown>): void {
    const layerId = kwargs.layerId as string;
    if (layerId) {
      this.removeOpacitySliderForLayer(layerId);
    }
  }

  private styleSwitcherContainer: HTMLDivElement | null = null;

  protected handleAddStyleSwitcher(args: unknown[], kwargs: Record<string, unknown>): void {
    if (!this.map) return;
    const styles = kwargs.styles as Record<string, string>;
    const position = kwargs.position as string || 'top-right';
    if (!styles || Object.keys(styles).length === 0) return;

    // Remove existing
    this.handleRemoveStyleSwitcher(args, kwargs);

    const container = document.createElement('div');
    container.className = 'maplibregl-ctrl maplibregl-ctrl-group anymap-style-switcher';
    container.style.cssText = 'padding:8px;background:rgba(255,255,255,0.95);border-radius:4px;';

    const select = document.createElement('select');
    select.style.cssText = 'font-size:12px;padding:2px 4px;border:1px solid #ccc;border-radius:3px;cursor:pointer;';

    for (const [name, url] of Object.entries(styles)) {
      const option = document.createElement('option');
      option.value = url;
      option.textContent = name;
      select.appendChild(option);
    }

    select.addEventListener('change', () => {
      this.map!.setStyle(select.value);
    });

    container.appendChild(select);

    const controlContainer = this.map.getContainer().querySelector(`.maplibregl-ctrl-${position}`);
    if (controlContainer) {
      controlContainer.appendChild(container);
    }

    this.styleSwitcherContainer = container;
  }

  protected handleRemoveStyleSwitcher(args: unknown[], kwargs: Record<string, unknown>): void {
    if (this.styleSwitcherContainer) {
      this.styleSwitcherContainer.remove();
      this.styleSwitcherContainer = null;
    }
  }

  // -------------------------------------------------------------------------
  // Data Export handlers (Section 7)
  // -------------------------------------------------------------------------

  protected handleGetVisibleFeatures(args: unknown[], kwargs: Record<string, unknown>): void {
    if (!this.map) return;
    const layers = kwargs.layers as string[] | undefined;

    try {
      const features = layers
        ? this.map.queryRenderedFeatures(undefined, { layers })
        : this.map.queryRenderedFeatures();

      const geojson: FeatureCollection = {
        type: 'FeatureCollection',
        features: features.map(f => ({
          type: 'Feature' as const,
          geometry: f.geometry,
          properties: f.properties,
        })),
      };

      // Send back via model
      if (this.model) {
        this.model.set('_queried_features', {
          type: 'visible_features',
          data: geojson,
        });
        this.model.save_changes();
      }
    } catch (err) {
      console.warn('Error getting visible features:', err);
    }
  }

  protected handleGetLayerData(args: unknown[], kwargs: Record<string, unknown>): void {
    if (!this.map) return;
    const sourceId = kwargs.sourceId as string;
    if (!sourceId) return;

    let features: maplibregl.GeoJSONFeature[] = [];
    let resolvedSourceId = sourceId;

    // Try the given sourceId first
    try {
      features = this.map.querySourceFeatures(sourceId);
    } catch {
      // Source doesn't exist with this ID
    }

    // If no results, try with '-source' suffix
    // (add_geojson creates sources as '{name}-source')
    if (features.length === 0 && !sourceId.endsWith('-source')) {
      const altSourceId = sourceId + '-source';
      try {
        const altFeatures = this.map.querySourceFeatures(altSourceId);
        if (altFeatures.length > 0) {
          features = altFeatures;
          resolvedSourceId = altSourceId;
        }
      } catch {
        // alt source doesn't exist either
      }
    }

    const geojson: FeatureCollection = {
      type: 'FeatureCollection',
      features: features.map(f => ({
        type: 'Feature' as const,
        geometry: f.geometry,
        properties: f.properties,
      })),
    };

    if (this.model) {
      this.model.set('_queried_features', {
        type: 'layer_data',
        sourceId: resolvedSourceId,
        data: geojson,
      });
      this.model.save_changes();
    }
  }

  // -------------------------------------------------------------------------
  // LiDAR layer handlers (maplibre-gl-lidar)
  // -------------------------------------------------------------------------

  /**
   * Add the LiDAR control panel.
   */
  private handleAddLidarControl(args: unknown[], kwargs: Record<string, unknown>): void {
    if (!this.map) return;

    // Don't add if already exists
    if (this.lidarControl) {
      console.warn('LiDAR control already exists');
      return;
    }

    const options = {
      position: (kwargs.position as string) || 'top-right',
      collapsed: kwargs.collapsed !== false,
      title: (kwargs.title as string) || 'LiDAR Viewer',
      panelWidth: (kwargs.panelWidth as number) || 365,
      panelMaxHeight: (kwargs.panelMaxHeight as number) || 600,
      pointSize: (kwargs.pointSize as number) || 2,
      opacity: (kwargs.opacity as number) || 1.0,
      colorScheme: (kwargs.colorScheme as string) || 'elevation',
      usePercentile: kwargs.usePercentile !== false,
      pointBudget: (kwargs.pointBudget as number) || 1000000,
      pickable: kwargs.pickable === true,
      autoZoom: kwargs.autoZoom !== false,
      copcLoadingMode: kwargs.copcLoadingMode as 'full' | 'dynamic' | undefined,
      streamingPointBudget: (kwargs.streamingPointBudget as number) || 5000000,
    };

    // Create and add the LiDAR control
    this.lidarControl = new LidarControl(options as LidarControlOptions);
    this.map.addControl(
      this.lidarControl as unknown as maplibregl.IControl,
      options.position as ControlPosition
    );

    // Listen for load events to track loaded point clouds
    this.lidarControl.on('load', (event) => {
      const info = event.pointCloud as { id: string; name: string; pointCount: number; source?: string } | undefined;
      if (info && 'name' in info) {
        this.lidarLayers.set(info.id, info.source || '');
        this.sendEvent('lidar:load', { id: info.id, name: info.name, pointCount: info.pointCount });
      }
    });

    this.lidarControl.on('unload', (event) => {
      const pointCloud = event.pointCloud as { id: string } | undefined;
      if (pointCloud) {
        this.lidarLayers.delete(pointCloud.id);
        this.sendEvent('lidar:unload', { id: pointCloud.id });
      }
    });

    // Register with existing layer control if present
    this.registerLidarAdapterWithLayerControl();
  }

  /**
   * Register the LiDAR adapter with the layer control if it exists.
   * This enables dynamic registration when LiDAR layers are added after the layer control.
   */
  private registerLidarAdapterWithLayerControl(): void {
    if (!this.lidarControl || !this.layerControlPlugin) return;

    const layerControl = this.layerControlPlugin.getControl();
    if (!layerControl) return;

    // Create adapter if not exists
    if (!this.lidarAdapter) {
      this.lidarAdapter = new LidarLayerAdapter(this.lidarControl);
    }

    // Register the adapter with the layer control
    layerControl.registerCustomAdapter(this.lidarAdapter);
  }

  /**
   * Add a LiDAR layer programmatically (loads from URL or base64 data).
   */
  private handleAddLidarLayer(args: unknown[], kwargs: Record<string, unknown>): void {
    if (!this.map) return;

    const source = kwargs.source as string;
    const name = (kwargs.name as string) || `lidar-${Date.now()}`;
    const isBase64 = kwargs.isBase64 === true;

    if (!source) {
      console.error('LiDAR layer requires a source URL or base64 data');
      return;
    }

    // Create LiDAR control if not exists (invisible panel mode)
    if (!this.lidarControl) {
      this.lidarControl = new LidarControl({
        collapsed: true,
        position: 'top-right',
        pointSize: (kwargs.pointSize as number) || 2,
        opacity: (kwargs.opacity as number) || 1.0,
        colorScheme: (kwargs.colorScheme as string) || 'elevation',
        usePercentile: kwargs.usePercentile !== false,
        pointBudget: (kwargs.pointBudget as number) || 1000000,
        pickable: kwargs.pickable !== false,
        autoZoom: kwargs.autoZoom !== false,
      } as LidarControlOptions);

      this.map.addControl(this.lidarControl as unknown as maplibregl.IControl, 'top-right');

      // Set up event listeners
      this.lidarControl.on('load', (event) => {
        const info = event.pointCloud as { id: string; name: string; pointCount: number; source?: string } | undefined;
        if (info && 'name' in info) {
          this.lidarLayers.set(info.id, info.source || '');
          this.sendEvent('lidar:load', { id: info.id, name: info.name, pointCount: info.pointCount });
        }
      });

      this.lidarControl.on('unload', (event) => {
        const pointCloud = event.pointCloud as { id: string } | undefined;
        if (pointCloud) {
          this.lidarLayers.delete(pointCloud.id);
          this.sendEvent('lidar:unload', { id: pointCloud.id });
        }
      });

      // Register with existing layer control if present
      this.registerLidarAdapterWithLayerControl();
    }

    // Apply styling options
    if (kwargs.colorScheme) {
      this.lidarControl.setColorScheme(kwargs.colorScheme as LidarColorScheme);
    }
    if (kwargs.pointSize !== undefined) {
      this.lidarControl.setPointSize(kwargs.pointSize as number);
    }
    if (kwargs.opacity !== undefined) {
      this.lidarControl.setOpacity(kwargs.opacity as number);
    }
    if (kwargs.pickable !== undefined) {
      this.lidarControl.setPickable(kwargs.pickable as boolean);
    }

    // Load the point cloud
    const loadOptions = {
      id: name,
      name: (kwargs.filename as string) || name,
    };

    if (isBase64) {
      // Convert base64 to ArrayBuffer
      const binaryString = atob(source);
      const bytes = new Uint8Array(binaryString.length);
      for (let i = 0; i < binaryString.length; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }
      const arrayBuffer = bytes.buffer;

      // Load from ArrayBuffer
      const streamingMode = kwargs.streamingMode !== false;
      if (streamingMode) {
        this.lidarControl.loadPointCloudStreaming(arrayBuffer, loadOptions as any);
      } else {
        this.lidarControl.loadPointCloud(arrayBuffer, loadOptions as any);
      }
    } else {
      // Load from URL
      const streamingMode = kwargs.streamingMode !== false;
      if (streamingMode) {
        this.lidarControl.loadPointCloudStreaming(source, loadOptions as any);
      } else {
        this.lidarControl.loadPointCloud(source, loadOptions as any);
      }
    }

    // Track the layer
    this.lidarLayers.set(name, source);
  }

  /**
   * Remove a LiDAR layer.
   */
  private handleRemoveLidarLayer(args: unknown[], kwargs: Record<string, unknown>): void {
    if (!this.lidarControl) return;

    const id = kwargs.id as string;
    if (id) {
      this.lidarControl.unloadPointCloud(id);
      this.lidarLayers.delete(id);
    } else {
      // Remove all layers
      this.lidarControl.unloadPointCloud();
      this.lidarLayers.clear();
    }
  }

  /**
   * Set LiDAR color scheme.
   */
  private handleSetLidarColorScheme(args: unknown[], kwargs: Record<string, unknown>): void {
    if (!this.lidarControl) return;
    const colorScheme = kwargs.colorScheme as string;
    if (colorScheme) {
      this.lidarControl.setColorScheme(colorScheme as any);
    }
  }

  /**
   * Set LiDAR point size.
   */
  private handleSetLidarPointSize(args: unknown[], kwargs: Record<string, unknown>): void {
    if (!this.lidarControl) return;
    const pointSize = kwargs.pointSize as number;
    if (pointSize !== undefined) {
      this.lidarControl.setPointSize(pointSize);
    }
  }

  /**
   * Set LiDAR layer opacity.
   */
  private handleSetLidarOpacity(args: unknown[], kwargs: Record<string, unknown>): void {
    if (!this.lidarControl) return;
    const opacity = kwargs.opacity as number;
    if (opacity !== undefined) {
      this.lidarControl.setOpacity(opacity);
    }
  }

  // -------------------------------------------------------------------------
  // maplibre-gl-components control handlers
  // -------------------------------------------------------------------------

  private handleAddPMTilesControl(args: unknown[], kwargs: Record<string, unknown>): void {
    if (!this.map) return;

    const position = (kwargs.position as ControlPosition) || 'top-right';
    const collapsed = kwargs.collapsed !== false;
    const defaultUrl = kwargs.defaultUrl as string || '';
    const loadDefaultUrl = kwargs.loadDefaultUrl as boolean || false;

    // Remove existing control if present
    const existingControl = this.controlsMap.get('pmtiles-control');
    if (existingControl) {
      this.map.removeControl(existingControl);
      this.controlsMap.delete('pmtiles-control');
    }

    // Create PMTiles control
    this.pmtilesLayerControl = new PMTilesLayerControl({
      collapsed,
      defaultUrl,
      loadDefaultUrl,
      defaultOpacity: (kwargs.defaultOpacity as number) ?? 1,
      defaultFillColor: kwargs.defaultFillColor as string || 'steelblue',
      defaultLineColor: kwargs.defaultLineColor as string || '#333',
      defaultPickable: kwargs.defaultPickable !== false,
    });

    this.map.addControl(this.pmtilesLayerControl as unknown as maplibregl.IControl, position);
    this.controlsMap.set('pmtiles-control', this.pmtilesLayerControl as unknown as maplibregl.IControl);

    // Set up event listeners
    this.pmtilesLayerControl.on('layeradd', (event) => {
      console.debug('PMTiles layer added:', event.url);
      this.sendEvent('pmtiles_layer_add', { url: event.url, layerId: event.layerId });
    });

    this.pmtilesLayerControl.on('layerremove', (event) => {
      console.debug('PMTiles layer removed:', event.layerId);
      this.sendEvent('pmtiles_layer_remove', { layerId: event.layerId });
    });

    this.pmtilesLayerControl.on('error', (event) => {
      console.error('PMTiles error:', event.error);
      this.sendEvent('pmtiles_error', { error: event.error });
    });
  }

  private handleAddCogControl(args: unknown[], kwargs: Record<string, unknown>): void {
    if (!this.map) return;

    const position = (kwargs.position as ControlPosition) || 'top-right';
    const collapsed = kwargs.collapsed !== false;
    const defaultUrl = kwargs.defaultUrl as string || '';
    const loadDefaultUrl = kwargs.loadDefaultUrl as boolean || false;

    // Remove existing control if present
    const existingControl = this.controlsMap.get('cog-control');
    if (existingControl) {
      this.map.removeControl(existingControl);
      this.controlsMap.delete('cog-control');
    }

    // Create COG control
    this.cogLayerUiControl = new CogLayerControl({
      collapsed,
      defaultUrl,
      loadDefaultUrl,
      defaultOpacity: (kwargs.defaultOpacity as number) ?? 1,
      defaultColormap: (kwargs.defaultColormap as string || 'viridis') as any,
      defaultBands: kwargs.defaultBands as string || '1',
      defaultRescaleMin: (kwargs.defaultRescaleMin as number) ?? 0,
      defaultRescaleMax: (kwargs.defaultRescaleMax as number) ?? 255,
    });

    this.map.addControl(this.cogLayerUiControl as unknown as maplibregl.IControl, position);
    this.controlsMap.set('cog-control', this.cogLayerUiControl as unknown as maplibregl.IControl);

    // Set up event listeners
    this.cogLayerUiControl.on('layeradd', (event) => {
      console.debug('COG layer added:', event.url);
      this.sendEvent('cog_layer_add', { url: event.url, layerId: event.layerId });
    });

    this.cogLayerUiControl.on('layerremove', (event) => {
      console.debug('COG layer removed:', event.layerId);
      this.sendEvent('cog_layer_remove', { layerId: event.layerId });
    });

    this.cogLayerUiControl.on('error', (event) => {
      console.error('COG error:', event.error);
      this.sendEvent('cog_error', { error: event.error });
    });
  }

  private handleAddZarrControl(args: unknown[], kwargs: Record<string, unknown>): void {
    if (!this.map) return;

    const position = (kwargs.position as ControlPosition) || 'top-right';
    const collapsed = kwargs.collapsed !== false;
    const defaultUrl = kwargs.defaultUrl as string || '';
    const loadDefaultUrl = kwargs.loadDefaultUrl as boolean || false;

    // Remove existing control if present
    const existingControl = this.controlsMap.get('zarr-control');
    if (existingControl) {
      this.map.removeControl(existingControl);
      this.controlsMap.delete('zarr-control');
    }

    // Create Zarr control
    this.zarrLayerUiControl = new ZarrLayerControl({
      collapsed,
      defaultUrl,
      loadDefaultUrl,
      defaultOpacity: (kwargs.defaultOpacity as number) ?? 1,
      defaultVariable: kwargs.defaultVariable as string || '',
      defaultClim: kwargs.defaultClim as [number, number] || [0, 1],
    });

    this.map.addControl(this.zarrLayerUiControl as unknown as maplibregl.IControl, position);
    this.controlsMap.set('zarr-control', this.zarrLayerUiControl as unknown as maplibregl.IControl);

    // Set up event listeners
    this.zarrLayerUiControl.on('layeradd', (event) => {
      console.debug('Zarr layer added:', event.url);
      this.sendEvent('zarr_layer_add', { url: event.url, layerId: event.layerId });
    });

    this.zarrLayerUiControl.on('layerremove', (event) => {
      console.debug('Zarr layer removed:', event.layerId);
      this.sendEvent('zarr_layer_remove', { layerId: event.layerId });
    });

    this.zarrLayerUiControl.on('error', (event) => {
      console.error('Zarr error:', event.error);
      this.sendEvent('zarr_error', { error: event.error });
    });
  }

  private handleAddVectorControl(args: unknown[], kwargs: Record<string, unknown>): void {
    if (!this.map) return;

    const position = (kwargs.position as ControlPosition) || 'top-right';
    const collapsed = kwargs.collapsed !== false;
    const defaultUrl = kwargs.defaultUrl as string || '';
    const loadDefaultUrl = kwargs.loadDefaultUrl as boolean || false;

    // Remove existing control if present
    const existingControl = this.controlsMap.get('vector-control');
    if (existingControl) {
      this.map.removeControl(existingControl);
      this.controlsMap.delete('vector-control');
    }

    // Create AddVector control
    this.addVectorControl = new AddVectorControl({
      collapsed,
      defaultUrl,
      loadDefaultUrl,
      defaultOpacity: (kwargs.defaultOpacity as number) ?? 1,
      defaultFillColor: kwargs.defaultFillColor as string || '#3388ff',
      defaultStrokeColor: kwargs.defaultStrokeColor as string || '#3388ff',
      fitBounds: kwargs.fitBounds !== false,
    });

    this.map.addControl(this.addVectorControl as unknown as maplibregl.IControl, position);
    this.controlsMap.set('vector-control', this.addVectorControl as unknown as maplibregl.IControl);

    // Set up event listeners
    this.addVectorControl.on('layeradd', (event) => {
      console.debug('Vector layer added:', event.url);
      this.sendEvent('vector_layer_add', { url: event.url, layerId: event.layerId });
    });

    this.addVectorControl.on('layerremove', (event) => {
      console.debug('Vector layer removed:', event.layerId);
      this.sendEvent('vector_layer_remove', { layerId: event.layerId });
    });

    this.addVectorControl.on('error', (event) => {
      console.error('Vector error:', event.error);
      this.sendEvent('vector_error', { error: event.error });
    });
  }

  private handleAddControlGrid(_args: unknown[], kwargs: Record<string, unknown>): void {
    if (!this.map) return;

    const position = (kwargs.position as string) || 'top-right';

    // Remove existing control grid if present
    if (this.controlGrid) {
      this.map.removeControl(this.controlGrid as unknown as maplibregl.IControl);
      this.controlsMap.delete('control-grid');
      this.controlGrid = null;
    }

    // Build options for addControlGrid
    const options: Record<string, unknown> = { position };

    if (kwargs.defaultControls !== undefined && kwargs.defaultControls !== null) {
      options.defaultControls = kwargs.defaultControls;
    }
    if (kwargs.exclude !== undefined && kwargs.exclude !== null) {
      options.exclude = kwargs.exclude;
    }
    if (kwargs.rows !== undefined && kwargs.rows !== null) {
      options.rows = kwargs.rows;
    }
    if (kwargs.columns !== undefined && kwargs.columns !== null) {
      options.columns = kwargs.columns;
    }
    if (kwargs.collapsed !== undefined) {
      options.collapsed = kwargs.collapsed;
    }
    if (kwargs.collapsible !== undefined) {
      options.collapsible = kwargs.collapsible;
    }
    if (kwargs.title !== undefined) {
      options.title = kwargs.title;
    }
    if (kwargs.showRowColumnControls !== undefined) {
      options.showRowColumnControls = kwargs.showRowColumnControls;
    }
    if (kwargs.gap !== undefined && kwargs.gap !== null) {
      options.gap = kwargs.gap;
    }
    if (kwargs.basemapStyleUrl !== undefined) {
      options.basemapStyleUrl = kwargs.basemapStyleUrl;
    } else {
      // Use the current map style URL as default for SwipeControl
      const style = this.model.get('style');
      if (typeof style === 'string') {
        options.basemapStyleUrl = style;
      }
    }
    if (kwargs.excludeLayers !== undefined && kwargs.excludeLayers !== null) {
      options.excludeLayers = kwargs.excludeLayers;
    }

    this.controlGrid = addControlGrid(this.map, options as Parameters<typeof addControlGrid>[1]);
    this.controlsMap.set('control-grid', this.controlGrid as unknown as maplibregl.IControl);

    // Register adapters with LayerControl if present
    const layerControl = this.layerControlPlugin?.getControl();
    if (layerControl) {
      for (const adapter of this.controlGrid.getAdapters()) {
        layerControl.registerCustomAdapter(adapter);
      }
    }

    this.stateManager.addControl('control-grid', 'control-grid', position, kwargs);
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
  // PMTiles layer handlers
  // -------------------------------------------------------------------------

  private handleAddPMTilesLayer(args: unknown[], kwargs: Record<string, unknown>): void {
    if (!this.map) return;

    const url = kwargs.url as string;
    const layerId = kwargs.id as string;
    const sourceType = (kwargs.sourceType as string) || 'vector';
    const opacity = (kwargs.opacity as number) ?? 1.0;
    const visible = kwargs.visible !== false;
    const style = (kwargs.style as Record<string, unknown>) || {};

    // Ensure pmtiles:// protocol prefix
    const pmtilesUrl = url.startsWith('pmtiles://') ? url : `pmtiles://${url}`;

    try {
      // Add source
      const sourceId = `${layerId}-source`;
      if (!this.map.getSource(sourceId)) {
        const sourceConfig = {
          type: sourceType as 'vector' | 'raster',
          url: pmtilesUrl,
        };
        this.map.addSource(sourceId, sourceConfig);
        // Persist source state for multi-cell rendering
        this.stateManager.addSource(sourceId, sourceConfig as unknown as SourceConfig);
      }

      // Add layer
      if (!this.map.getLayer(layerId)) {
        let layerConfig: Record<string, unknown>;

        if (sourceType === 'vector') {
          const layerType = (style.type as string) || 'fill';

          // Build paint properties based on layer type
          let defaultPaint: Record<string, unknown> = {};
          if (layerType === 'fill') {
            defaultPaint = {
              'fill-color': '#3388ff',
              'fill-opacity': opacity,
            };
          } else if (layerType === 'line') {
            defaultPaint = {
              'line-color': '#3388ff',
              'line-width': 2,
              'line-opacity': opacity,
            };
          } else if (layerType === 'circle') {
            defaultPaint = {
              'circle-color': '#3388ff',
              'circle-radius': 5,
              'circle-opacity': opacity,
            };
          }

          // Extract paint properties from style (everything except type and source-layer)
          const paintFromStyle: Record<string, unknown> = {};
          for (const [key, value] of Object.entries(style)) {
            if (key !== 'type' && key !== 'source-layer') {
              paintFromStyle[key] = value;
            }
          }

          layerConfig = {
            id: layerId,
            type: layerType,
            source: sourceId,
            layout: {
              visibility: visible ? 'visible' : 'none',
            },
            paint: { ...defaultPaint, ...paintFromStyle },
          };

          if (style['source-layer']) {
            layerConfig['source-layer'] = style['source-layer'];
          }

          this.map.addLayer(layerConfig as maplibregl.AddLayerObject);
        } else {
          // Raster PMTiles
          layerConfig = {
            id: layerId,
            type: 'raster',
            source: sourceId,
            paint: {
              'raster-opacity': opacity,
            },
            layout: {
              visibility: visible ? 'visible' : 'none',
            },
          };
          this.map.addLayer(layerConfig as maplibregl.AddLayerObject);
        }

        // Persist layer state for multi-cell rendering
        this.stateManager.addLayer(layerId, layerConfig as unknown as LayerConfig);
      }
    } catch (error) {
      console.error(`[anymap-ts] Error adding PMTiles layer "${layerId}":`, error);
    }
  }

  private handleRemovePMTilesLayer(args: unknown[], kwargs: Record<string, unknown>): void {
    if (!this.map) return;
    const [layerId] = args as [string];
    const sourceId = `${layerId}-source`;

    if (this.map.getLayer(layerId)) {
      this.map.removeLayer(layerId);
    }
    if (this.map.getSource(sourceId)) {
      this.map.removeSource(sourceId);
    }
  }

  // -------------------------------------------------------------------------
  // Clustering handlers
  // -------------------------------------------------------------------------

  private handleAddClusterLayer(args: unknown[], kwargs: Record<string, unknown>): void {
    if (!this.map) return;

    const geojson = kwargs.data as GeoJSON.FeatureCollection;
    const name = kwargs.name as string;
    const clusterRadius = (kwargs.clusterRadius as number) || 50;
    const clusterMaxZoom = (kwargs.clusterMaxZoom as number) || 14;
    const clusterColors = (kwargs.clusterColors as string[]) || ['#51bbd6', '#f1f075', '#f28cb1'];
    const clusterSteps = (kwargs.clusterSteps as number[]) || [100, 750];
    const clusterMinRadius = (kwargs.clusterMinRadius as number) || 15;
    const clusterMaxRadius = (kwargs.clusterMaxRadius as number) || 30;
    const unclusteredColor = (kwargs.unclusteredColor as string) || '#11b4da';
    const unclusteredRadius = (kwargs.unclusteredRadius as number) || 8;
    const showClusterCount = kwargs.showClusterCount !== false;
    const zoomOnClick = kwargs.zoomOnClick !== false;
    const fitBounds = kwargs.fitBounds !== false;

    const sourceId = `${name}-source`;

    // Add source with clustering enabled
    if (!this.map.getSource(sourceId)) {
      this.map.addSource(sourceId, {
        type: 'geojson',
        data: geojson,
        cluster: true,
        clusterMaxZoom: clusterMaxZoom,
        clusterRadius: clusterRadius,
      });
      this.stateManager.addSource(sourceId, {
        type: 'geojson',
        data: geojson,
        cluster: true,
        clusterMaxZoom,
        clusterRadius,
      } as unknown as SourceConfig);
    }

    // Build step expression for cluster colors
    const colorExpr: unknown[] = ['step', ['get', 'point_count'], clusterColors[0]];
    for (let i = 0; i < clusterSteps.length; i++) {
      colorExpr.push(clusterSteps[i]);
      colorExpr.push(clusterColors[i + 1]);
    }

    // Build step expression for cluster radius
    const radiusExpr: unknown[] = ['step', ['get', 'point_count'], clusterMinRadius];
    const radiusStep = (clusterMaxRadius - clusterMinRadius) / clusterSteps.length;
    for (let i = 0; i < clusterSteps.length; i++) {
      radiusExpr.push(clusterSteps[i]);
      radiusExpr.push(clusterMinRadius + radiusStep * (i + 1));
    }

    // Layer for cluster circles
    const clusterLayerId = `${name}-clusters`;
    if (!this.map.getLayer(clusterLayerId)) {
      this.map.addLayer({
        id: clusterLayerId,
        type: 'circle',
        source: sourceId,
        filter: ['has', 'point_count'],
        paint: {
          'circle-color': colorExpr as maplibregl.ExpressionSpecification,
          'circle-radius': radiusExpr as maplibregl.ExpressionSpecification,
        },
      });
      this.stateManager.addLayer(clusterLayerId, {
        id: clusterLayerId,
        type: 'circle',
        source: sourceId,
        filter: ['has', 'point_count'],
      } as unknown as LayerConfig);
    }

    // Layer for cluster count labels
    if (showClusterCount) {
      const countLayerId = `${name}-cluster-count`;
      if (!this.map.getLayer(countLayerId)) {
        this.map.addLayer({
          id: countLayerId,
          type: 'symbol',
          source: sourceId,
          filter: ['has', 'point_count'],
          layout: {
            'text-field': '{point_count_abbreviated}',
            'text-font': ['Open Sans Bold', 'Arial Unicode MS Bold'],
            'text-size': 12,
          },
          paint: {
            'text-color': '#ffffff',
          },
        });
        this.stateManager.addLayer(countLayerId, {
          id: countLayerId,
          type: 'symbol',
          source: sourceId,
          filter: ['has', 'point_count'],
        } as unknown as LayerConfig);
      }
    }

    // Layer for unclustered points
    const unclusteredLayerId = `${name}-unclustered`;
    if (!this.map.getLayer(unclusteredLayerId)) {
      this.map.addLayer({
        id: unclusteredLayerId,
        type: 'circle',
        source: sourceId,
        filter: ['!', ['has', 'point_count']],
        paint: {
          'circle-color': unclusteredColor,
          'circle-radius': unclusteredRadius,
          'circle-stroke-width': 1,
          'circle-stroke-color': '#fff',
        },
      });
      this.stateManager.addLayer(unclusteredLayerId, {
        id: unclusteredLayerId,
        type: 'circle',
        source: sourceId,
        filter: ['!', ['has', 'point_count']],
      } as unknown as LayerConfig);
    }

    // Add click handler for zoom-to-cluster
    if (zoomOnClick) {
      this.map.on('click', clusterLayerId, (e) => {
        if (!this.map) return;
        const features = this.map.queryRenderedFeatures(e.point, {
          layers: [clusterLayerId],
        });
        if (!features.length) return;

        const clusterId = features[0].properties?.cluster_id;
        const source = this.map.getSource(sourceId) as maplibregl.GeoJSONSource;
        source.getClusterExpansionZoom(clusterId).then((zoom: number) => {
          if (!this.map) return;
          const coordinates = (features[0].geometry as GeoJSON.Point).coordinates;
          this.map.easeTo({
            center: coordinates as [number, number],
            zoom: zoom ?? this.map.getZoom() + 2,
          });
        }).catch(() => {
          // Ignore errors
        });
      });

      // Change cursor on cluster hover
      this.map.on('mouseenter', clusterLayerId, () => {
        if (this.map) this.map.getCanvas().style.cursor = 'pointer';
      });
      this.map.on('mouseleave', clusterLayerId, () => {
        if (this.map) this.map.getCanvas().style.cursor = '';
      });
    }

    // Fit bounds
    if (fitBounds && kwargs.bounds) {
      const bounds = kwargs.bounds as [number, number, number, number];
      this.map.fitBounds(
        [[bounds[0], bounds[1]], [bounds[2], bounds[3]]],
        { padding: 50 }
      );
    }
  }

  private handleRemoveClusterLayer(args: unknown[], kwargs: Record<string, unknown>): void {
    if (!this.map) return;
    const [layerId] = args as [string];
    const sourceId = `${layerId}-source`;

    // Remove all sublayers
    const layerIds = [
      `${layerId}-clusters`,
      `${layerId}-cluster-count`,
      `${layerId}-unclustered`,
    ];

    for (const id of layerIds) {
      if (this.map.getLayer(id)) {
        this.map.removeLayer(id);
        this.stateManager.removeLayer(id);
      }
    }

    if (this.map.getSource(sourceId)) {
      this.map.removeSource(sourceId);
      this.stateManager.removeSource(sourceId);
    }
  }

  // -------------------------------------------------------------------------
  // Choropleth handlers
  // -------------------------------------------------------------------------

  private handleAddChoropleth(args: unknown[], kwargs: Record<string, unknown>): void {
    if (!this.map) return;

    const geojson = kwargs.data as GeoJSON.FeatureCollection;
    const name = kwargs.name as string;
    const stepExpression = kwargs.stepExpression as unknown[];
    const fillOpacity = (kwargs.fillOpacity as number) ?? 0.7;
    const lineColor = (kwargs.lineColor as string) || '#000000';
    const lineWidth = (kwargs.lineWidth as number) ?? 1;
    const hover = kwargs.hover !== false;
    const fitBounds = kwargs.fitBounds !== false;

    const sourceId = `${name}-source`;
    const fillLayerId = name;
    const lineLayerId = `${name}-outline`;

    // Add source
    if (!this.map.getSource(sourceId)) {
      this.map.addSource(sourceId, {
        type: 'geojson',
        data: geojson,
        generateId: true, // Required for feature-state hover
      });
      this.stateManager.addSource(sourceId, {
        type: 'geojson',
        data: geojson,
        generateId: true,
      } as unknown as SourceConfig);
    }

    // Add fill layer with choropleth colors
    if (!this.map.getLayer(fillLayerId)) {
      const fillPaint: maplibregl.FillLayerSpecification['paint'] = {
        'fill-color': stepExpression as maplibregl.ExpressionSpecification,
        'fill-opacity': [
          'case',
          ['boolean', ['feature-state', 'hover'], false],
          Math.min(fillOpacity + 0.2, 1),
          fillOpacity,
        ],
      };

      this.map.addLayer({
        id: fillLayerId,
        type: 'fill',
        source: sourceId,
        paint: fillPaint,
      });
      this.stateManager.addLayer(fillLayerId, {
        id: fillLayerId,
        type: 'fill',
        source: sourceId,
      } as unknown as LayerConfig);
    }

    // Add outline layer
    if (!this.map.getLayer(lineLayerId)) {
      this.map.addLayer({
        id: lineLayerId,
        type: 'line',
        source: sourceId,
        paint: {
          'line-color': lineColor,
          'line-width': [
            'case',
            ['boolean', ['feature-state', 'hover'], false],
            lineWidth * 2,
            lineWidth,
          ],
        },
      });
      this.stateManager.addLayer(lineLayerId, {
        id: lineLayerId,
        type: 'line',
        source: sourceId,
      } as unknown as LayerConfig);
    }

    // Add hover effect
    if (hover) {
      this.setupHoverEffect(fillLayerId, sourceId);
    }

    // Fit bounds
    if (fitBounds && kwargs.bounds) {
      const bounds = kwargs.bounds as [number, number, number, number];
      this.map.fitBounds(
        [[bounds[0], bounds[1]], [bounds[2], bounds[3]]],
        { padding: 50 }
      );
    }
  }

  private setupHoverEffect(layerId: string, sourceId: string): void {
    if (!this.map) return;

    this.map.on('mousemove', layerId, (e) => {
      if (!this.map || e.features?.length === 0) return;

      // Clear previous hover state
      if (this.hoveredFeatureId !== null && this.hoveredLayerId) {
        this.map.setFeatureState(
          { source: sourceId, id: this.hoveredFeatureId },
          { hover: false }
        );
      }

      const feature = e.features![0];
      this.hoveredFeatureId = feature.id ?? null;
      this.hoveredLayerId = layerId;

      if (this.hoveredFeatureId !== null) {
        this.map.setFeatureState(
          { source: sourceId, id: this.hoveredFeatureId },
          { hover: true }
        );
      }

      this.map.getCanvas().style.cursor = 'pointer';
    });

    this.map.on('mouseleave', layerId, () => {
      if (!this.map) return;

      if (this.hoveredFeatureId !== null) {
        this.map.setFeatureState(
          { source: sourceId, id: this.hoveredFeatureId },
          { hover: false }
        );
      }
      this.hoveredFeatureId = null;
      this.hoveredLayerId = null;
      this.map.getCanvas().style.cursor = '';
    });
  }

  // -------------------------------------------------------------------------
  // 3D Buildings handlers
  // -------------------------------------------------------------------------

  private handleAdd3DBuildings(args: unknown[], kwargs: Record<string, unknown>): void {
    if (!this.map) return;

    const source = (kwargs.source as string) || 'openmaptiles';
    const minZoom = (kwargs.minZoom as number) ?? 14;
    const fillExtrusionColor = (kwargs.fillExtrusionColor as string) || '#aaa';
    const fillExtrusionOpacity = (kwargs.fillExtrusionOpacity as number) ?? 0.6;
    const heightProperty = (kwargs.heightProperty as string) || 'render_height';
    const baseProperty = (kwargs.baseProperty as string) || 'render_min_height';
    const layerId = (kwargs.layerId as string) || '3d-buildings';

    // Check if the style has a building source
    const style = this.map.getStyle();
    let buildingSourceId: string | null = null;
    let sourceLayerName = 'building';

    // Try to find a building-related vector source in the existing style
    if (style.sources) {
      for (const [id, src] of Object.entries(style.sources)) {
        const srcObj = src as { type?: string };
        if (srcObj.type === 'vector') {
          // Check for common vector tile sources with buildings
          if (id.includes('openmaptiles') || id.includes('maptiler') ||
              id.includes('carto') || id === source || id === 'composite') {
            buildingSourceId = id;
            break;
          }
        }
      }
    }

    // If no suitable source found, add OpenFreeMap vector tiles source
    if (!buildingSourceId) {
      buildingSourceId = 'buildings-source';
      if (!this.map.getSource(buildingSourceId)) {
        // Use OpenFreeMap tiles which are free and have building data
        this.map.addSource(buildingSourceId, {
          type: 'vector',
          url: 'https://tiles.openfreemap.org/planet',
        });
      }
    }

    // Add 3D buildings layer
    if (!this.map.getLayer(layerId)) {
      try {
        this.map.addLayer({
          id: layerId,
          source: buildingSourceId,
          'source-layer': sourceLayerName,
          filter: ['all',
            ['==', ['geometry-type'], 'Polygon'],
            ['has', 'render_height']
          ],
          type: 'fill-extrusion',
          minzoom: minZoom,
          paint: {
            'fill-extrusion-color': fillExtrusionColor,
            'fill-extrusion-height': [
              'coalesce',
              ['get', heightProperty],
              ['get', 'height'],
              10
            ],
            'fill-extrusion-base': [
              'coalesce',
              ['get', baseProperty],
              0
            ],
            'fill-extrusion-opacity': fillExtrusionOpacity,
          },
        });
      } catch (e) {
        // If filter fails, try simpler filter
        console.warn('3D buildings: trying simpler filter');
        this.map.addLayer({
          id: layerId,
          source: buildingSourceId,
          'source-layer': sourceLayerName,
          type: 'fill-extrusion',
          minzoom: minZoom,
          paint: {
            'fill-extrusion-color': fillExtrusionColor,
            'fill-extrusion-height': [
              'coalesce',
              ['get', heightProperty],
              ['get', 'height'],
              10
            ],
            'fill-extrusion-base': 0,
            'fill-extrusion-opacity': fillExtrusionOpacity,
          },
        });
      }
      this.stateManager.addLayer(layerId, {
        id: layerId,
        type: 'fill-extrusion',
        source: buildingSourceId,
      } as unknown as LayerConfig);
    }
  }

  // -------------------------------------------------------------------------
  // Route Animation handlers
  // -------------------------------------------------------------------------

  private handleAnimateAlongRoute(args: unknown[], kwargs: Record<string, unknown>): void {
    if (!this.map) return;

    const id = kwargs.id as string;
    const coordinates = kwargs.coordinates as [number, number][];
    const duration = (kwargs.duration as number) || 10000;
    const loop = kwargs.loop !== false;
    const markerColor = (kwargs.markerColor as string) || '#3388ff';
    const markerSize = (kwargs.markerSize as number) || 1.0;
    const showTrail = kwargs.showTrail === true;
    const trailColor = (kwargs.trailColor as string) || '#3388ff';
    const trailWidth = (kwargs.trailWidth as number) || 3;

    // Create LineString for route calculations
    const line = lineString(coordinates);
    const routeLength = length(line, { units: 'kilometers' });

    // Create marker at start position
    const marker = new Marker({ color: markerColor, scale: markerSize })
      .setLngLat(coordinates[0])
      .addTo(this.map);

    // Add trail if requested
    let trailSourceId: string | undefined;
    let trailLayerId: string | undefined;
    if (showTrail) {
      trailSourceId = `${id}-trail-source`;
      trailLayerId = `${id}-trail`;

      if (!this.map.getSource(trailSourceId)) {
        this.map.addSource(trailSourceId, {
          type: 'geojson',
          data: {
            type: 'Feature',
            properties: {},
            geometry: { type: 'LineString', coordinates: [] },
          },
        });
      }

      if (!this.map.getLayer(trailLayerId)) {
        this.map.addLayer({
          id: trailLayerId,
          type: 'line',
          source: trailSourceId,
          paint: {
            'line-color': trailColor,
            'line-width': trailWidth,
            'line-opacity': 0.8,
          },
        });
      }
    }

    const startTime = performance.now();
    const trailCoords: [number, number][] = [coordinates[0]];

    const animate = (currentTime: number) => {
      const animation = this.animations.get(id);
      if (!animation || !this.map) return;

      if (animation.isPaused) {
        animation.animationId = requestAnimationFrame(animate);
        return;
      }

      let elapsed = (currentTime - animation.startTime) * animation.speed;
      if (animation.pausedAt > 0) {
        elapsed = (currentTime - animation.pausedAt + (animation.pausedAt - animation.startTime)) * animation.speed;
      }

      const progress = (elapsed % animation.duration) / animation.duration;

      // Calculate position along route
      const distance = progress * routeLength;
      const point = along(line, distance, { units: 'kilometers' });
      const position = point.geometry.coordinates as [number, number];

      // Update marker position
      animation.marker.setLngLat(position);

      // Update trail
      if (showTrail && trailSourceId) {
        trailCoords.push(position);
        const source = this.map.getSource(trailSourceId) as maplibregl.GeoJSONSource;
        if (source) {
          source.setData({
            type: 'Feature',
            properties: {},
            geometry: { type: 'LineString', coordinates: trailCoords },
          });
        }
      }

      // Check if we should loop or stop
      if (elapsed >= animation.duration && !loop) {
        this.handleStopAnimation([id], {});
        return;
      }

      animation.animationId = requestAnimationFrame(animate);
    };

    // Store animation state
    this.animations.set(id, {
      animationId: requestAnimationFrame(animate),
      marker,
      isPaused: false,
      speed: 1,
      startTime,
      pausedAt: 0,
      duration,
      coordinates,
      loop,
      trailSourceId,
      trailLayerId,
    });
  }

  private handleStopAnimation(args: unknown[], kwargs: Record<string, unknown>): void {
    const [id] = args as [string];
    const animation = this.animations.get(id);
    if (!animation) return;

    cancelAnimationFrame(animation.animationId);
    animation.marker.remove();

    // Remove trail if exists
    if (animation.trailLayerId && this.map?.getLayer(animation.trailLayerId)) {
      this.map.removeLayer(animation.trailLayerId);
    }
    if (animation.trailSourceId && this.map?.getSource(animation.trailSourceId)) {
      this.map.removeSource(animation.trailSourceId);
    }

    this.animations.delete(id);
  }

  private handlePauseAnimation(args: unknown[], kwargs: Record<string, unknown>): void {
    const [id] = args as [string];
    const animation = this.animations.get(id);
    if (!animation) return;

    animation.isPaused = true;
    animation.pausedAt = performance.now();
  }

  private handleResumeAnimation(args: unknown[], kwargs: Record<string, unknown>): void {
    const [id] = args as [string];
    const animation = this.animations.get(id);
    if (!animation || !animation.isPaused) return;

    const pausedDuration = performance.now() - animation.pausedAt;
    animation.startTime += pausedDuration;
    animation.isPaused = false;
    animation.pausedAt = 0;
  }

  private handleSetAnimationSpeed(args: unknown[], kwargs: Record<string, unknown>): void {
    const [id, speed] = args as [string, number];
    const animation = this.animations.get(id);
    if (!animation) return;

    animation.speed = speed;
  }

  // -------------------------------------------------------------------------
  // Feature Hover handlers
  // -------------------------------------------------------------------------

  private handleAddHoverEffect(args: unknown[], kwargs: Record<string, unknown>): void {
    if (!this.map) return;

    const layerId = kwargs.layerId as string;
    const highlightColor = kwargs.highlightColor as string | undefined;
    const highlightOpacity = kwargs.highlightOpacity as number | undefined;
    const highlightOutlineWidth = (kwargs.highlightOutlineWidth as number) || 2;

    // Get the source ID for this layer
    const layer = this.map.getLayer(layerId);
    if (!layer) {
      console.warn(`Layer ${layerId} not found`);
      return;
    }

    const sourceId = (layer as unknown as { source: string }).source;

    // Set up hover handlers using feature-state
    this.map.on('mousemove', layerId, (e) => {
      if (!this.map || !e.features?.length) return;

      // Clear previous hover state
      if (this.hoveredFeatureId !== null) {
        this.map.setFeatureState(
          { source: sourceId, id: this.hoveredFeatureId },
          { hover: false }
        );
      }

      const feature = e.features[0];
      this.hoveredFeatureId = feature.id ?? null;
      this.hoveredLayerId = layerId;

      if (this.hoveredFeatureId !== null) {
        this.map.setFeatureState(
          { source: sourceId, id: this.hoveredFeatureId },
          { hover: true }
        );
      }

      this.map.getCanvas().style.cursor = 'pointer';
    });

    this.map.on('mouseleave', layerId, () => {
      if (!this.map) return;

      if (this.hoveredFeatureId !== null) {
        this.map.setFeatureState(
          { source: sourceId, id: this.hoveredFeatureId },
          { hover: false }
        );
      }
      this.hoveredFeatureId = null;
      this.hoveredLayerId = null;
      this.map.getCanvas().style.cursor = '';
    });

    // Update layer paint properties to respond to hover state
    const layerType = (layer as unknown as { type: string }).type;

    if (layerType === 'fill') {
      if (highlightOpacity !== undefined) {
        this.map.setPaintProperty(layerId, 'fill-opacity', [
          'case',
          ['boolean', ['feature-state', 'hover'], false],
          highlightOpacity,
          this.map.getPaintProperty(layerId, 'fill-opacity') || 0.5,
        ]);
      }
      if (highlightColor) {
        this.map.setPaintProperty(layerId, 'fill-color', [
          'case',
          ['boolean', ['feature-state', 'hover'], false],
          highlightColor,
          this.map.getPaintProperty(layerId, 'fill-color') || '#3388ff',
        ]);
      }
    } else if (layerType === 'line') {
      this.map.setPaintProperty(layerId, 'line-width', [
        'case',
        ['boolean', ['feature-state', 'hover'], false],
        highlightOutlineWidth,
        this.map.getPaintProperty(layerId, 'line-width') || 2,
      ]);
    } else if (layerType === 'circle') {
      if (highlightOpacity !== undefined) {
        this.map.setPaintProperty(layerId, 'circle-opacity', [
          'case',
          ['boolean', ['feature-state', 'hover'], false],
          highlightOpacity,
          this.map.getPaintProperty(layerId, 'circle-opacity') || 0.8,
        ]);
      }
    }
  }

  // -------------------------------------------------------------------------
  // Cleanup
  // -------------------------------------------------------------------------

  // -------------------------------------------------------------------------
  // Sky & Fog handlers
  // -------------------------------------------------------------------------

  private handleSetSky(args: unknown[], kwargs: Record<string, unknown>): void {
    if (!this.map) return;
    const spec: SkySpecification = {};
    if (kwargs.skyColor !== undefined) spec['sky-color'] = kwargs.skyColor as string;
    if (kwargs.skyHorizonBlend !== undefined) spec['sky-horizon-blend'] = kwargs.skyHorizonBlend as number;
    if (kwargs.horizonColor !== undefined) spec['horizon-color'] = kwargs.horizonColor as string;
    if (kwargs.horizonFogBlend !== undefined) spec['horizon-fog-blend'] = kwargs.horizonFogBlend as number;
    if (kwargs.fogColor !== undefined) spec['fog-color'] = kwargs.fogColor as string;
    if (kwargs.fogGroundBlend !== undefined) spec['fog-ground-blend'] = kwargs.fogGroundBlend as number;
    if (kwargs.atmosphereBlend !== undefined) spec['atmosphere-blend'] = kwargs.atmosphereBlend as number;
    (this.map as unknown as { setSky: (spec: SkySpecification) => void }).setSky(spec);
  }

  private handleRemoveSky(args: unknown[], kwargs: Record<string, unknown>): void {
    if (!this.map) return;
    (this.map as unknown as { setSky: (spec: undefined) => void }).setSky(undefined);
  }

  // -------------------------------------------------------------------------
  // Feature Query/Filter handlers
  // -------------------------------------------------------------------------

  private handleSetFilter(args: unknown[], kwargs: Record<string, unknown>): void {
    if (!this.map) return;
    const layerId = kwargs.layerId as string;
    const filter = kwargs.filter as unknown[] | null;

    if (!layerId) {
      console.error('setFilter requires layerId');
      return;
    }

    if (!this.map.getLayer(layerId)) {
      console.warn(`Layer ${layerId} not found`);
      return;
    }

    this.map.setFilter(layerId, filter as maplibregl.FilterSpecification | null);
    this.stateManager.setLayerFilter(layerId, filter);
  }

  private handleQueryRenderedFeatures(args: unknown[], kwargs: Record<string, unknown>): void {
    if (!this.map) return;
    const geometry = kwargs.geometry as { x: number; y: number } | [[number, number], [number, number]] | undefined;
    const layers = kwargs.layers as string[] | undefined;
    const filter = kwargs.filter as unknown[] | undefined;

    const options: { layers?: string[]; filter?: maplibregl.FilterSpecification } = {};
    if (layers) options.layers = layers;
    if (filter) options.filter = filter as maplibregl.FilterSpecification;

    const features = geometry
      ? this.map.queryRenderedFeatures(geometry as maplibregl.PointLike | [maplibregl.PointLike, maplibregl.PointLike], options)
      : this.map.queryRenderedFeatures(options);

    const result = {
      type: 'FeatureCollection' as const,
      features: features.map(f => ({
        type: 'Feature' as const,
        geometry: f.geometry,
        properties: f.properties,
        id: f.id,
        layer: f.layer?.id,
        source: f.source,
      })),
    };

    this.model.set('_queried_features', result);
    this.model.save_changes();
  }

  private handleQuerySourceFeatures(args: unknown[], kwargs: Record<string, unknown>): void {
    if (!this.map) return;
    const sourceId = kwargs.sourceId as string;
    const sourceLayer = kwargs.sourceLayer as string | undefined;
    const filter = kwargs.filter as unknown[] | undefined;

    if (!sourceId) {
      console.error('querySourceFeatures requires sourceId');
      return;
    }

    const options: { sourceLayer?: string; filter?: maplibregl.FilterSpecification } = {};
    if (sourceLayer) options.sourceLayer = sourceLayer;
    if (filter) options.filter = filter as maplibregl.FilterSpecification;

    const features = this.map.querySourceFeatures(sourceId, options);

    const result = {
      type: 'FeatureCollection' as const,
      features: features.map(f => ({
        type: 'Feature' as const,
        geometry: f.geometry,
        properties: f.properties,
        id: f.id,
      })),
    };

    this.model.set('_queried_features', result);
    this.model.save_changes();
  }

  // -------------------------------------------------------------------------
  // Video Layer handlers
  // -------------------------------------------------------------------------

  private handleAddVideoLayer(args: unknown[], kwargs: Record<string, unknown>): void {
    if (!this.map) return;

    const id = (kwargs.id as string) || `video-${Date.now()}`;
    const urls = kwargs.urls as string[];
    const coordinates = kwargs.coordinates as number[][];
    const opacity = (kwargs.opacity as number) ?? 1.0;

    if (!urls || !urls.length || !coordinates || coordinates.length !== 4) {
      console.error('addVideoLayer requires urls array and 4 corner coordinates');
      return;
    }

    const sourceId = `${id}-source`;

    if (!this.map.getSource(sourceId)) {
      this.map.addSource(sourceId, {
        type: 'video',
        urls: urls,
        coordinates: coordinates as [[number, number], [number, number], [number, number], [number, number]],
      });
      this.stateManager.addSource(sourceId, {
        type: 'video',
        urls: urls,
        coordinates: coordinates,
      });
    }

    if (!this.map.getLayer(id)) {
      const layerConfig: LayerConfig = {
        id: id,
        type: 'raster',
        source: sourceId,
        paint: {
          'raster-opacity': opacity,
        },
      };
      this.map.addLayer(layerConfig as maplibregl.LayerSpecification);
      this.stateManager.addLayer(id, layerConfig);
    }

    this.videoSources.set(id, sourceId);
  }

  private handleRemoveVideoLayer(args: unknown[], kwargs: Record<string, unknown>): void {
    if (!this.map) return;
    const id = kwargs.id as string;
    if (!id) return;

    if (this.map.getLayer(id)) {
      this.map.removeLayer(id);
      this.stateManager.removeLayer(id);
    }

    const sourceId = this.videoSources.get(id) || `${id}-source`;
    if (this.map.getSource(sourceId)) {
      this.map.removeSource(sourceId);
      this.stateManager.removeSource(sourceId);
    }

    this.videoSources.delete(id);
  }

  private handlePlayVideo(args: unknown[], kwargs: Record<string, unknown>): void {
    if (!this.map) return;
    const id = kwargs.id as string;
    const sourceId = this.videoSources.get(id) || `${id}-source`;
    const source = this.map.getSource(sourceId);
    if (source && 'play' in source) {
      (source as unknown as { play: () => void }).play();
    }
  }

  private handlePauseVideo(args: unknown[], kwargs: Record<string, unknown>): void {
    if (!this.map) return;
    const id = kwargs.id as string;
    const sourceId = this.videoSources.get(id) || `${id}-source`;
    const source = this.map.getSource(sourceId);
    if (source && 'pause' in source) {
      (source as unknown as { pause: () => void }).pause();
    }
  }

  private handleSeekVideo(args: unknown[], kwargs: Record<string, unknown>): void {
    if (!this.map) return;
    const id = kwargs.id as string;
    const time = kwargs.time as number;
    const sourceId = this.videoSources.get(id) || `${id}-source`;
    const source = this.map.getSource(sourceId);
    if (source && 'getVideo' in source) {
      const video = (source as unknown as { getVideo: () => HTMLVideoElement }).getVideo();
      if (video) {
        video.currentTime = time;
      }
    }
  }

  // -------------------------------------------------------------------------
  // Split Map handlers
  // -------------------------------------------------------------------------

  private handleAddSplitMap(args: unknown[], kwargs: Record<string, unknown>): void {
    if (!this.map || !this.mapContainer) return;

    const leftLayer = kwargs.leftLayer as string;
    const rightLayer = kwargs.rightLayer as string;
    const position = (kwargs.position as number) ?? 50;

    if (!leftLayer || !rightLayer) {
      console.error('addSplitMap requires leftLayer and rightLayer');
      return;
    }

    // Remove existing split if any
    if (this.splitActive) {
      this.handleRemoveSplitMap([], {});
    }

    this.splitActive = true;

    // Hide the right layer on the primary map
    if (this.map.getLayer(rightLayer)) {
      this.map.setLayoutProperty(rightLayer, 'visibility', 'none');
    }

    // Create overlay container for the right map
    const rightContainer = document.createElement('div');
    rightContainer.style.position = 'absolute';
    rightContainer.style.top = '0';
    rightContainer.style.left = '0';
    rightContainer.style.width = '100%';
    rightContainer.style.height = '100%';
    rightContainer.style.clipPath = `inset(0 0 0 ${position}%)`;
    rightContainer.style.pointerEvents = 'none';
    this.mapContainer.appendChild(rightContainer);
    this.splitMapContainer = rightContainer;

    // Create the right map
    const style = this.model.get('style');
    const rightMap = new MapLibreMap({
      container: rightContainer,
      style: typeof style === 'string' ? style : (style as maplibregl.StyleSpecification),
      center: this.map.getCenter(),
      zoom: this.map.getZoom(),
      bearing: this.map.getBearing(),
      pitch: this.map.getPitch(),
      interactive: false,
      attributionControl: false,
    });

    this.splitMapRight = rightMap;

    rightMap.on('load', () => {
      // Hide the left layer on the right map, show the right layer
      if (rightMap.getLayer(leftLayer)) {
        rightMap.setLayoutProperty(leftLayer, 'visibility', 'none');
      }

      // Replay sources and layers from state on right map
      const sources = this.model.get('_sources') || {};
      for (const [sourceId, sourceConfig] of Object.entries(sources)) {
        if (!rightMap.getSource(sourceId)) {
          try {
            rightMap.addSource(sourceId, sourceConfig as unknown as maplibregl.SourceSpecification);
          } catch (e) {
            // Source may already be from style
          }
        }
      }

      const layers = this.model.get('_layers') || {};
      for (const [layerId, layerConfig] of Object.entries(layers)) {
        const config = layerConfig as unknown as LayerConfig;
        if (!rightMap.getLayer(layerId)) {
          try {
            rightMap.addLayer(config as maplibregl.LayerSpecification);
          } catch (e) {
            // Layer may already be from style
          }
        }
        // Show only the right layer, hide everything else
        if (layerId === rightLayer) {
          rightMap.setLayoutProperty(layerId, 'visibility', 'visible');
        } else {
          try {
            rightMap.setLayoutProperty(layerId, 'visibility', 'none');
          } catch (e) {
            // May not exist
          }
        }
      }
    });

    // Sync camera from primary to secondary
    const syncMaps = () => {
      if (!this.map || !this.splitMapRight) return;
      this.splitMapRight.jumpTo({
        center: this.map.getCenter(),
        zoom: this.map.getZoom(),
        bearing: this.map.getBearing(),
        pitch: this.map.getPitch(),
      });
    };

    this.map.on('move', syncMaps);

    // Create slider
    const slider = document.createElement('div');
    slider.style.position = 'absolute';
    slider.style.top = '0';
    slider.style.left = `${position}%`;
    slider.style.width = '4px';
    slider.style.height = '100%';
    slider.style.backgroundColor = '#333';
    slider.style.cursor = 'ew-resize';
    slider.style.zIndex = '10';
    slider.style.boxShadow = '-1px 0 0 rgba(255,255,255,0.6), 1px 0 0 rgba(255,255,255,0.6), 0 0 6px rgba(0,0,0,0.5)';

    // Slider handle
    const handle = document.createElement('div');
    handle.style.position = 'absolute';
    handle.style.top = '50%';
    handle.style.left = '50%';
    handle.style.transform = 'translate(-50%, -50%)';
    handle.style.width = '36px';
    handle.style.height = '36px';
    handle.style.borderRadius = '50%';
    handle.style.backgroundColor = '#fff';
    handle.style.border = '2px solid #333';
    handle.style.boxShadow = '0 1px 6px rgba(0,0,0,0.5)';
    handle.style.display = 'flex';
    handle.style.alignItems = 'center';
    handle.style.justifyContent = 'center';
    handle.style.fontSize = '16px';
    handle.style.color = '#333';
    handle.style.fontWeight = 'bold';
    handle.innerHTML = '&#x2194;';
    slider.appendChild(handle);

    this.mapContainer.appendChild(slider);
    this.splitSlider = slider;

    // Dragging logic
    let isDragging = false;

    const onPointerDown = (e: PointerEvent) => {
      isDragging = true;
      slider.setPointerCapture(e.pointerId);
      e.preventDefault();
    };

    const onPointerMove = (e: PointerEvent) => {
      if (!isDragging || !this.mapContainer || !this.splitMapContainer) return;
      const rect = this.mapContainer.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const pct = Math.max(0, Math.min(100, (x / rect.width) * 100));
      slider.style.left = `${pct}%`;
      this.splitMapContainer.style.clipPath = `inset(0 0 0 ${pct}%)`;
    };

    const onPointerUp = () => {
      isDragging = false;
    };

    slider.addEventListener('pointerdown', onPointerDown);
    window.addEventListener('pointermove', onPointerMove);
    window.addEventListener('pointerup', onPointerUp);

    // Store cleanup refs on the slider element
    (slider as unknown as Record<string, unknown>)._cleanup = () => {
      slider.removeEventListener('pointerdown', onPointerDown);
      window.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('pointerup', onPointerUp);
      this.map?.off('move', syncMaps);
    };

    // Persist in controls
    this.stateManager.addControl('split-map', 'split-map', 'overlay', {
      leftLayer,
      rightLayer,
      position,
    });
  }

  private handleRemoveSplitMap(args: unknown[], kwargs: Record<string, unknown>): void {
    if (!this.splitActive) return;

    // Clean up slider event listeners
    if (this.splitSlider) {
      const cleanup = (this.splitSlider as unknown as Record<string, unknown>)?._cleanup as (() => void) | undefined;
      if (cleanup) cleanup();
      this.splitSlider.remove();
      this.splitSlider = null;
    }

    // Remove right map
    if (this.splitMapRight) {
      this.splitMapRight.remove();
      this.splitMapRight = null;
    }

    // Remove right container
    if (this.splitMapContainer) {
      this.splitMapContainer.remove();
      this.splitMapContainer = null;
    }

    // Restore all layer visibility on primary map
    if (this.map) {
      const layers = this.model.get('_layers') || {};
      for (const [layerId, layerConfig] of Object.entries(layers)) {
        const config = layerConfig as { visible?: boolean };
        if (config.visible !== false && this.map.getLayer(layerId)) {
          this.map.setLayoutProperty(layerId, 'visibility', 'visible');
        }
      }
    }

    this.splitActive = false;
    this.stateManager.removeControl('split-map');
  }

  // -------------------------------------------------------------------------
  // Colorbar handlers
  // -------------------------------------------------------------------------

  private handleAddColorbar(_args: unknown[], kwargs: Record<string, unknown>): void {
    if (!this.map) return;

    const colorbarId = (kwargs.colorbarId as string) || `colorbar-${Date.now()}`;
    const position = (kwargs.position as ControlPosition) || 'bottom-right';

    // Remove existing colorbar with same ID
    const existing = this.colorbarsMap.get(colorbarId);
    if (existing) {
      this.map.removeControl(existing as unknown as maplibregl.IControl);
      this.colorbarsMap.delete(colorbarId);
      this.controlsMap.delete(colorbarId);
    }

    // Build options
    const options: Record<string, unknown> = {};
    if (kwargs.colormap !== undefined) options.colormap = kwargs.colormap;
    if (kwargs.vmin !== undefined) options.vmin = kwargs.vmin;
    if (kwargs.vmax !== undefined) options.vmax = kwargs.vmax;
    if (kwargs.label !== undefined) options.label = kwargs.label;
    if (kwargs.units !== undefined) options.units = kwargs.units;
    if (kwargs.orientation !== undefined) options.orientation = kwargs.orientation;
    if (kwargs.barThickness !== undefined) options.barThickness = kwargs.barThickness;
    if (kwargs.barLength !== undefined) options.barLength = kwargs.barLength;
    if (kwargs.ticks !== undefined) options.ticks = kwargs.ticks;
    if (kwargs.opacity !== undefined) options.opacity = kwargs.opacity;

    const colorbar = new Colorbar(options as ConstructorParameters<typeof Colorbar>[0]);
    this.map.addControl(colorbar as unknown as maplibregl.IControl, position);
    this.colorbarsMap.set(colorbarId, colorbar);
    this.controlsMap.set(colorbarId, colorbar as unknown as maplibregl.IControl);
    this.stateManager.addControl(colorbarId, 'colorbar', position, kwargs);
  }

  private handleRemoveColorbar(args: unknown[], kwargs: Record<string, unknown>): void {
    if (!this.map) return;

    const colorbarId = (kwargs.colorbarId as string) || (args[0] as string);

    if (colorbarId) {
      // Remove specific colorbar
      const colorbar = this.colorbarsMap.get(colorbarId);
      if (colorbar) {
        this.map.removeControl(colorbar as unknown as maplibregl.IControl);
        this.colorbarsMap.delete(colorbarId);
        this.controlsMap.delete(colorbarId);
        this.stateManager.removeControl(colorbarId);
      }
    } else {
      // Remove all colorbars
      this.colorbarsMap.forEach((colorbar, id) => {
        if (this.map) {
          this.map.removeControl(colorbar as unknown as maplibregl.IControl);
        }
        this.controlsMap.delete(id);
        this.stateManager.removeControl(id);
      });
      this.colorbarsMap.clear();
    }
  }

  private handleUpdateColorbar(_args: unknown[], kwargs: Record<string, unknown>): void {
    if (!this.map) return;

    const colorbarId = (kwargs.colorbarId as string) || 'colorbar-0';
    const colorbar = this.colorbarsMap.get(colorbarId);
    if (!colorbar) {
      console.warn(`Colorbar '${colorbarId}' not found`);
      return;
    }

    // Build update options
    const updateOptions: Record<string, unknown> = {};
    if (kwargs.colormap !== undefined) updateOptions.colormap = kwargs.colormap;
    if (kwargs.vmin !== undefined) updateOptions.vmin = kwargs.vmin;
    if (kwargs.vmax !== undefined) updateOptions.vmax = kwargs.vmax;
    if (kwargs.label !== undefined) updateOptions.label = kwargs.label;
    if (kwargs.units !== undefined) updateOptions.units = kwargs.units;
    if (kwargs.orientation !== undefined) updateOptions.orientation = kwargs.orientation;
    if (kwargs.barThickness !== undefined) updateOptions.barThickness = kwargs.barThickness;
    if (kwargs.barLength !== undefined) updateOptions.barLength = kwargs.barLength;
    if (kwargs.ticks !== undefined) updateOptions.ticks = kwargs.ticks;
    if (kwargs.opacity !== undefined) updateOptions.opacity = kwargs.opacity;

    colorbar.update(updateOptions as Parameters<typeof colorbar.update>[0]);
  }

  // -------------------------------------------------------------------------
  // Search Control handlers
  // -------------------------------------------------------------------------

  private handleAddSearchControl(_args: unknown[], kwargs: Record<string, unknown>): void {
    if (!this.map) return;

    const position = (kwargs.position as ControlPosition) || 'top-left';

    // Remove existing search control
    if (this.searchControl) {
      this.map.removeControl(this.searchControl as unknown as maplibregl.IControl);
      this.controlsMap.delete('search-control');
      this.searchControl = null;
    }

    // Build options
    const options: Record<string, unknown> = {};
    if (kwargs.placeholder !== undefined) options.placeholder = kwargs.placeholder;
    if (kwargs.collapsed !== undefined) options.collapsed = kwargs.collapsed;
    if (kwargs.flyToZoom !== undefined) options.flyToZoom = kwargs.flyToZoom;
    if (kwargs.showMarker !== undefined) options.showMarker = kwargs.showMarker;
    if (kwargs.markerColor !== undefined) options.markerColor = kwargs.markerColor;
    if (kwargs.maxResults !== undefined) options.maxResults = kwargs.maxResults;
    if (kwargs.debounceMs !== undefined) options.debounceMs = kwargs.debounceMs;

    this.searchControl = new SearchControl(options as ConstructorParameters<typeof SearchControl>[0]);

    // Wire result selection event
    this.searchControl.on('resultselect', (event) => {
      this.sendEvent('search_result_select', {
        result: (event as Record<string, unknown>).result,
      });
    });

    this.map.addControl(this.searchControl as unknown as maplibregl.IControl, position);
    this.controlsMap.set('search-control', this.searchControl as unknown as maplibregl.IControl);
    this.stateManager.addControl('search-control', 'search-control', position, kwargs);
  }

  private handleRemoveSearchControl(_args: unknown[], _kwargs: Record<string, unknown>): void {
    if (!this.map || !this.searchControl) return;

    this.map.removeControl(this.searchControl as unknown as maplibregl.IControl);
    this.controlsMap.delete('search-control');
    this.stateManager.removeControl('search-control');
    this.searchControl = null;
  }

  // -------------------------------------------------------------------------
  // Measure Control handlers
  // -------------------------------------------------------------------------

  private handleAddMeasureControl(_args: unknown[], kwargs: Record<string, unknown>): void {
    if (!this.map) return;

    const position = (kwargs.position as ControlPosition) || 'top-right';

    // Remove existing measure control
    if (this.measureControl) {
      this.map.removeControl(this.measureControl as unknown as maplibregl.IControl);
      this.controlsMap.delete('measure-control');
      this.measureControl = null;
    }

    // Build options
    const options: Record<string, unknown> = {};
    if (kwargs.collapsed !== undefined) options.collapsed = kwargs.collapsed;
    if (kwargs.defaultMode !== undefined) options.defaultMode = kwargs.defaultMode;
    if (kwargs.distanceUnit !== undefined) options.distanceUnit = kwargs.distanceUnit;
    if (kwargs.areaUnit !== undefined) options.areaUnit = kwargs.areaUnit;
    if (kwargs.lineColor !== undefined) options.lineColor = kwargs.lineColor;
    if (kwargs.lineWidth !== undefined) options.lineWidth = kwargs.lineWidth;
    if (kwargs.fillColor !== undefined) options.fillColor = kwargs.fillColor;

    this.measureControl = new MeasureControl(options as ConstructorParameters<typeof MeasureControl>[0]);

    this.map.addControl(this.measureControl as unknown as maplibregl.IControl, position);
    this.controlsMap.set('measure-control', this.measureControl as unknown as maplibregl.IControl);
    this.stateManager.addControl('measure-control', 'measure-control', position, kwargs);
  }

  private handleRemoveMeasureControl(_args: unknown[], _kwargs: Record<string, unknown>): void {
    if (!this.map || !this.measureControl) return;

    this.map.removeControl(this.measureControl as unknown as maplibregl.IControl);
    this.controlsMap.delete('measure-control');
    this.stateManager.removeControl('measure-control');
    this.measureControl = null;
  }

  // -------------------------------------------------------------------------
  // Print Control handlers
  // -------------------------------------------------------------------------

  private handleAddPrintControl(_args: unknown[], kwargs: Record<string, unknown>): void {
    if (!this.map) return;

    const position = (kwargs.position as ControlPosition) || 'top-right';

    // Remove existing print control
    if (this.printControl) {
      this.map.removeControl(this.printControl as unknown as maplibregl.IControl);
      this.controlsMap.delete('print-control');
      this.printControl = null;
    }

    // Build options
    const options: Record<string, unknown> = {};
    if (kwargs.collapsed !== undefined) options.collapsed = kwargs.collapsed;
    if (kwargs.format !== undefined) options.format = kwargs.format;
    if (kwargs.filename !== undefined) options.filename = kwargs.filename;
    if (kwargs.includeNorthArrow !== undefined) options.includeNorthArrow = kwargs.includeNorthArrow;
    if (kwargs.includeScaleBar !== undefined) options.includeScaleBar = kwargs.includeScaleBar;

    this.printControl = new PrintControl(options as ConstructorParameters<typeof PrintControl>[0]);

    // Wire export event
    this.printControl.on('export', (event) => {
      this.sendEvent('print_export', {
        state: (event as Record<string, unknown>).state,
      });
    });

    this.map.addControl(this.printControl as unknown as maplibregl.IControl, position);
    this.controlsMap.set('print-control', this.printControl as unknown as maplibregl.IControl);
    this.stateManager.addControl('print-control', 'print-control', position, kwargs);
  }

  private handleRemovePrintControl(_args: unknown[], _kwargs: Record<string, unknown>): void {
    if (!this.map || !this.printControl) return;

    this.map.removeControl(this.printControl as unknown as maplibregl.IControl);
    this.controlsMap.delete('print-control');
    this.stateManager.removeControl('print-control');
    this.printControl = null;
  }

  // -------------------------------------------------------------------------
  // GeoPhoto Control handlers
  // -------------------------------------------------------------------------

  private handleAddGeoPhotoControl(_args: unknown[], kwargs: Record<string, unknown>): void {
    if (!this.map) return;

    const position = (kwargs.position as ControlPosition) || 'top-right';

    // Remove existing geophoto control
    if (this.geoPhotoControl) {
      this.map.removeControl(this.geoPhotoControl as unknown as maplibregl.IControl);
      this.controlsMap.delete('geophoto-control');
      this.geoPhotoControl = null;
    }

    // Build options
    const options: Record<string, unknown> = {};
    if (kwargs.collapsed !== undefined) options.collapsed = kwargs.collapsed;
    if (kwargs.title !== undefined) options.title = kwargs.title;
    if (kwargs.panelWidth !== undefined) options.panelWidth = kwargs.panelWidth;
    if (kwargs.maxHeight !== undefined) options.maxHeight = kwargs.maxHeight;
    if (kwargs.showPath !== undefined) options.showPath = kwargs.showPath;
    if (kwargs.showPathDirectionArrows !== undefined) options.showPathDirectionArrows = kwargs.showPathDirectionArrows;
    if (kwargs.pathDirectionArrowSpacing !== undefined) options.pathDirectionArrowSpacing = kwargs.pathDirectionArrowSpacing;
    if (kwargs.pathDirectionArrowSize !== undefined) options.pathDirectionArrowSize = kwargs.pathDirectionArrowSize;
    if (kwargs.pathDirectionArrowColor !== undefined) options.pathDirectionArrowColor = kwargs.pathDirectionArrowColor;
    if (kwargs.preloadUrl !== undefined) options.preloadUrl = kwargs.preloadUrl;
    if (kwargs.fitBoundsOnLoad !== undefined) options.fitBoundsOnLoad = kwargs.fitBoundsOnLoad;
    if (kwargs.fitBoundsPadding !== undefined) options.fitBoundsPadding = kwargs.fitBoundsPadding;
    if (kwargs.showObjects !== undefined) options.showObjects = kwargs.showObjects;
    if (kwargs.pathColor !== undefined) options.pathColor = kwargs.pathColor;
    if (kwargs.pointColor !== undefined) options.pointColor = kwargs.pointColor;
    if (kwargs.selectedPointColor !== undefined) options.selectedPointColor = kwargs.selectedPointColor;

    this.geoPhotoControl = new GeoPhotoControl(options as any);

    // Wire events
    this.geoPhotoControl.on('cameraselect', (event: any) => {
      const camera = event.camera;
      const cameraIndex = event.cameraIndex;
      this.sendEvent('geophoto:cameraselect', {
        camera: camera ? {
          id: camera.id,
          coordinates: camera.coordinates,
          elevation: camera.elevation,
          captureTime: camera.captureTime,
        } : null,
        cameraIndex,
      });
    });

    this.geoPhotoControl.on('dataloaded', () => {
      this.sendEvent('geophoto:dataloaded', {
        cameraCount: this.geoPhotoControl?.getCameras().length || 0,
      });
    });

    this.geoPhotoControl.on('datacleared', () => {
      this.sendEvent('geophoto:datacleared', {});
    });

    this.map.addControl(this.geoPhotoControl as unknown as maplibregl.IControl, position);
    this.controlsMap.set('geophoto-control', this.geoPhotoControl as unknown as maplibregl.IControl);
    this.stateManager.addControl('geophoto-control', 'geophoto-control', position, kwargs);
  }

  private handleRemoveGeoPhotoControl(_args: unknown[], _kwargs: Record<string, unknown>): void {
    if (!this.map || !this.geoPhotoControl) return;

    this.geoPhotoControl.clearData();
    this.map.removeControl(this.geoPhotoControl as unknown as maplibregl.IControl);
    this.controlsMap.delete('geophoto-control');
    this.stateManager.removeControl('geophoto-control');
    this.geoPhotoControl = null;
  }

  private async handleLoadGeoPhotoZip(_args: unknown[], kwargs: Record<string, unknown>): Promise<void> {
    if (!this.geoPhotoControl) {
      console.warn('GeoPhoto control not added. Call addGeoPhotoControl first.');
      return;
    }
    const url = kwargs.url as string;
    if (!url) {
      console.error('loadGeoPhotoZip requires a url parameter');
      return;
    }
    await this.geoPhotoControl.loadZipFromUrl(url);
  }

  private async handleLoadGeoPhotoUrls(_args: unknown[], kwargs: Record<string, unknown>): Promise<void> {
    if (!this.geoPhotoControl) {
      console.warn('GeoPhoto control not added. Call addGeoPhotoControl first.');
      return;
    }
    const trajectoryGeojsonUrl = kwargs.trajectoryGeojsonUrl as string;
    if (!trajectoryGeojsonUrl) {
      console.error('loadGeoPhotoUrls requires a trajectoryGeojsonUrl parameter');
      return;
    }
    const trajectoryJsonUrl = kwargs.trajectoryJsonUrl as string | undefined;
    const objectsUrl = kwargs.objectsUrl as string | undefined;
    const imageBasePath = kwargs.imageBasePath as string | undefined;
    await this.geoPhotoControl.loadFromUrls(
      trajectoryGeojsonUrl,
      trajectoryJsonUrl,
      objectsUrl,
      imageBasePath,
    );
  }

  private handleGeoPhotoSelectCamera(_args: unknown[], kwargs: Record<string, unknown>): void {
    if (!this.geoPhotoControl) return;
    const index = kwargs.index as number;
    if (typeof index === 'number') {
      this.geoPhotoControl.selectCamera(index);
    }
  }

  private handleGeoPhotoNextCamera(_args: unknown[], _kwargs: Record<string, unknown>): void {
    if (!this.geoPhotoControl) return;
    this.geoPhotoControl.nextCamera();
  }

  private handleGeoPhotoPrevCamera(_args: unknown[], _kwargs: Record<string, unknown>): void {
    if (!this.geoPhotoControl) return;
    this.geoPhotoControl.prevCamera();
  }

  private handleGeoPhotoPlay(_args: unknown[], _kwargs: Record<string, unknown>): void {
    if (!this.geoPhotoControl) return;
    this.geoPhotoControl.play();
  }

  private handleGeoPhotoStop(_args: unknown[], _kwargs: Record<string, unknown>): void {
    if (!this.geoPhotoControl) return;
    this.geoPhotoControl.stop();
  }

  private handleGeoPhotoClearData(_args: unknown[], _kwargs: Record<string, unknown>): void {
    if (!this.geoPhotoControl) return;
    this.geoPhotoControl.clearData();
  }

  // -------------------------------------------------------------------------
  // FlatGeobuf handlers
  // -------------------------------------------------------------------------

  private async handleAddFlatGeobuf(_args: unknown[], kwargs: Record<string, unknown>): Promise<void> {
    if (!this.map) return;

    const url = kwargs.url as string;
    const name = (kwargs.name as string) || `flatgeobuf-${Date.now()}`;
    const layerType = kwargs.layerType as string | undefined;
    const paint = kwargs.paint as Record<string, unknown> | undefined;
    const fitBounds = kwargs.fitBounds !== false;

    const sourceId = `${name}-source`;
    const layerId = name;

    try {
      // Fetch the FlatGeobuf file and stream features via ReadableStream.
      // Using fetch+ReadableStream avoids the `deserializeFiltered` path
      // which requires a bounding-box Rect parameter.
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      const features: Feature[] = [];
      for await (const feature of flatgeobuf.deserialize(response.body as ReadableStream)) {
        features.push(feature as Feature);
      }

      const featureCollection: FeatureCollection = {
        type: 'FeatureCollection',
        features,
      };

      // Infer layer type from geometry
      let type = layerType;
      if (!type && features.length > 0) {
        type = this.inferLayerType(features[0].geometry.type);
      }
      type = type || 'circle';

      // Get default paint if not provided
      const layerPaint = paint || this.getDefaultPaint(type);

      // Add source
      if (!this.map.getSource(sourceId)) {
        const sourceConfig = {
          type: 'geojson' as const,
          data: featureCollection,
        };
        this.map.addSource(sourceId, sourceConfig);
        this.stateManager.addSource(sourceId, sourceConfig as unknown as SourceConfig);
      }

      // Add layer
      if (!this.map.getLayer(layerId)) {
        const layerConfig = {
          id: layerId,
          type: type as maplibregl.LayerSpecification['type'],
          source: sourceId,
          paint: layerPaint,
        };
        this.map.addLayer(layerConfig as maplibregl.AddLayerObject);
        this.stateManager.addLayer(layerId, layerConfig as unknown as LayerConfig);
      }

      // Fit bounds
      if (fitBounds && features.length > 0) {
        const bounds = new maplibregl.LngLatBounds();
        for (const feature of features) {
          const geometry = feature.geometry;
          if (geometry.type === 'Point') {
            bounds.extend(geometry.coordinates as [number, number]);
          } else if (geometry.type === 'MultiPoint' || geometry.type === 'LineString') {
            for (const coord of geometry.coordinates) {
              bounds.extend(coord as [number, number]);
            }
          } else if (geometry.type === 'MultiLineString' || geometry.type === 'Polygon') {
            for (const ring of geometry.coordinates) {
              for (const coord of ring) {
                bounds.extend(coord as [number, number]);
              }
            }
          } else if (geometry.type === 'MultiPolygon') {
            for (const polygon of geometry.coordinates) {
              for (const ring of polygon) {
                for (const coord of ring) {
                  bounds.extend(coord as [number, number]);
                }
              }
            }
          }
        }
        if (!bounds.isEmpty()) {
          this.map.fitBounds(bounds, { padding: 50 });
        }
      }
    } catch (error) {
      console.error(`Error loading FlatGeobuf from ${url}:`, error);
    }
  }

  private handleRemoveFlatGeobuf(args: unknown[], kwargs: Record<string, unknown>): void {
    if (!this.map) return;

    const name = (kwargs.name as string) || (args[0] as string);
    if (!name) return;

    const layerId = name;
    const sourceId = `${name}-source`;

    if (this.map.getLayer(layerId)) {
      this.map.removeLayer(layerId);
      this.stateManager.removeLayer(layerId);
    }

    if (this.map.getSource(sourceId)) {
      this.map.removeSource(sourceId);
      this.stateManager.removeSource(sourceId);
    }
  }

  destroy(): void {
    // Clean up split map
    if (this.splitActive) {
      this.handleRemoveSplitMap([], {});
    }

    // Remove model listeners
    this.removeModelListeners();

    // Clear resize debounce timer
    if (this.resizeDebounceTimer !== null) {
      window.clearTimeout(this.resizeDebounceTimer);
      this.resizeDebounceTimer = null;
    }

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

    // Remove colorbars
    this.colorbarsMap.forEach((colorbar) => {
      if (this.map) {
        this.map.removeControl(colorbar as unknown as maplibregl.IControl);
      }
    });
    this.colorbarsMap.clear();

    // Remove search control
    if (this.searchControl && this.map) {
      this.map.removeControl(this.searchControl as unknown as maplibregl.IControl);
      this.searchControl = null;
    }

    // Remove measure control
    if (this.measureControl && this.map) {
      this.map.removeControl(this.measureControl as unknown as maplibregl.IControl);
      this.measureControl = null;
    }

    // Remove print control
    if (this.printControl && this.map) {
      this.map.removeControl(this.printControl as unknown as maplibregl.IControl);
      this.printControl = null;
    }

    // Remove GeoPhoto control
    if (this.geoPhotoControl && this.map) {
      this.geoPhotoControl.clearData();
      this.map.removeControl(this.geoPhotoControl as unknown as maplibregl.IControl);
      this.geoPhotoControl = null;
    }

    // Remove control grid
    if (this.controlGrid && this.map) {
      this.map.removeControl(this.controlGrid as unknown as maplibregl.IControl);
      this.controlGrid = null;
    }

    // Remove deck.gl overlay
    if (this.deckOverlay && this.map) {
      this.map.removeControl(this.deckOverlay as unknown as maplibregl.IControl);
      this.deckOverlay = null;
    }
    this.deckLayers.clear();

    // Remove LiDAR control and adapter
    if (this.lidarAdapter) {
      this.lidarAdapter.destroy();
      this.lidarAdapter = null;
    }
    if (this.lidarControl && this.map) {
      this.map.removeControl(this.lidarControl as unknown as maplibregl.IControl);
      this.lidarControl = null;
    }
    this.lidarLayers.clear();

    // Stop and remove all animations
    this.animations.forEach((animation, id) => {
      cancelAnimationFrame(animation.animationId);
      animation.marker.remove();
      if (animation.trailLayerId && this.map?.getLayer(animation.trailLayerId)) {
        this.map.removeLayer(animation.trailLayerId);
      }
      if (animation.trailSourceId && this.map?.getSource(animation.trailSourceId)) {
        this.map.removeSource(animation.trailSourceId);
      }
    });
    this.animations.clear();

    // Remove zarr layers
    this.zarrLayers.forEach((layer, id) => {
      if (this.map && this.map.getLayer(id)) {
        this.map.removeLayer(id);
      }
    });
    this.zarrLayers.clear();

    // Clear video sources
    this.videoSources.clear();

    // Remove markers
    this.markersMap.forEach((marker) => marker.remove());
    this.markersMap.clear();
    this.markerGroupsMap.clear();
    this.markerAdapter = null;

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
