/**
 * Mapbox GL JS renderer implementation.
 * Uses dynamic CDN imports to keep bundle size small.
 */

import { BaseMapRenderer } from '../core/BaseMapRenderer';
import { StateManager } from '../core/StateManager';
import type { MapWidgetModel } from '../types/anywidget';
import type {
  ControlPosition,
  FlyToOptions,
  FitBoundsOptions,
} from '../types/mapbox';
import type { Feature, FeatureCollection } from 'geojson';
import type { LidarControlOptions, LidarColorScheme } from '../types/lidar';

// Type imports for CDN-loaded modules
import type * as MapboxGl from 'mapbox-gl';
import type { MapboxOverlay } from '@deck.gl/mapbox';
import type { ZarrLayer } from '@carbonplan/zarr-layer';

// Dynamic import helpers
async function loadMapboxComponents() {
  const mod = await import("https://esm.sh/maplibre-gl-components@0.15.0?deps=@deck.gl/core@9.2.6,@deck.gl/mapbox@9.2.6,@deck.gl/layers@9.2.6");
  return mod;
}

async function loadMapboxLidar() {
  const mod = await import("https://esm.sh/maplibre-gl-lidar@0.11.1?deps=@deck.gl/core@9.2.6");
  return mod;
}

async function loadDeckGl() {
  const [layers, aggregationLayers, geoLayers, mapbox] = await Promise.all([
    import("https://esm.sh/@deck.gl/layers@9.2.6"),
    import("https://esm.sh/@deck.gl/aggregation-layers@9.2.6"),
    import("https://esm.sh/@deck.gl/geo-layers@9.2.6"),
    import("https://esm.sh/@deck.gl/mapbox@9.2.6"),
  ]);
  return { layers, aggregationLayers, geoLayers, mapbox };
}

async function loadTurf() {
  const [along, length, helpers] = await Promise.all([
    import("https://esm.sh/@turf/along@7"),
    import("https://esm.sh/@turf/length@7"),
    import("https://esm.sh/@turf/helpers@7"),
  ]);
  return {
    along: along.default,
    length: length.default,
    lineString: helpers.lineString,
  };
}

async function loadZarrLayer() {
  const mod = await import("https://esm.sh/@carbonplan/zarr-layer@0.3.1");
  return mod;
}

async function loadGeotiff() {
  const mod = await import("https://esm.sh/@developmentseed/deck.gl-geotiff@0.2.0?deps=@deck.gl/core@9.2.6,@deck.gl/layers@9.2.6");
  return mod;
}

async function loadGeokeysParser() {
  const mod = await import("https://esm.sh/geotiff-geokeys-to-proj4@2024.4.13");
  return mod;
}

async function loadFlatgeobuf() {
  const mod = await import("https://esm.sh/flatgeobuf@3.35.0/lib/geojson.mjs");
  return mod;
}

async function loadMapboxDraw() {
  const mod = await import("https://esm.sh/@mapbox/mapbox-gl-draw@1");
  return mod.default;
}

/**
 * Mapbox GL JS map renderer.
 */
export class MapboxRenderer extends BaseMapRenderer<MapboxGl.Map> {
  private stateManager: StateManager;
  private markersMap: globalThis.Map<string, MapboxGl.Marker> = new globalThis.Map();
  private popupsMap: globalThis.Map<string, MapboxGl.Popup> = new globalThis.Map();
  private controlsMap: globalThis.Map<string, MapboxGl.IControl> = new globalThis.Map();
  private legendsMap: globalThis.Map<string, HTMLElement> = new globalThis.Map();
  private resizeObserver: ResizeObserver | null = null;
  private resizeDebounceTimer: number | null = null;

  // Mapbox module reference (loaded from CDN)
  private mapboxgl: typeof MapboxGl;
  private accessToken: string;

  // Deck.gl overlay for COG layers
  protected deckOverlay: MapboxOverlay | null = null;
  protected deckLayers: globalThis.Map<string, unknown> = new globalThis.Map();

  // Zarr layers
  protected zarrLayers: globalThis.Map<string, ZarrLayer> = new globalThis.Map();

  // Draw control (Mapbox Draw)
  private mapboxDraw: any | null = null;

  // maplibre-gl-components controls
  protected pmtilesLayerControl: any | null = null;
  protected cogLayerUiControl: any | null = null;
  protected zarrLayerUiControl: any | null = null;
  protected addVectorControl: any | null = null;
  protected controlGrid: any | null = null;

  // Colorbar, Search, Measure, Print controls
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
  private splitMapRight: MapboxGl.Map | null = null;
  private splitMapContainer: HTMLDivElement | null = null;
  private splitSlider: HTMLDivElement | null = null;
  private splitActive: boolean = false;

  // Tooltip and coordinates
  private tooltipLayerHandlers: Map<string, (e: MapboxGl.MapMouseEvent & { features?: GeoJSON.Feature[] }) => void> = new Map();
  private coordinatesControl: HTMLDivElement | null = null;
  private coordinatesHandler: ((e: MapboxGl.MapMouseEvent) => void) | null = null;

  // Time slider, opacity slider, style switcher
  private timeSliderContainer: HTMLDivElement | null = null;
  private opacitySliderContainer: Map<string, HTMLDivElement> = new Map();
  private styleSwitcherContainer: HTMLDivElement | null = null;

  // Swipe map
  private swipeContainer: HTMLDivElement | null = null;
  private swipeHandler: (() => void) | null = null;

  // LiDAR control
  protected lidarControl: any | null = null;
  protected lidarLayers: globalThis.Map<string, string> = new globalThis.Map();

  constructor(model: MapWidgetModel, el: HTMLElement, mapboxgl: typeof MapboxGl) {
    super(model, el);
    this.mapboxgl = mapboxgl;
    this.accessToken = (model.get("access_token") as string) || "";
    this.stateManager = new StateManager(model);
    this.registerMethods();
  }

  /**
   * Initialize the Mapbox map.
   */
  async initialize(): Promise<void> {
    this.createMapContainer();
    this.map = this.createMap();
    this.setupModelListeners();
    this.setupMapEvents();
    this.setupResizeObserver();
    this.processJsCalls();

    await new Promise<void>((resolve) => {
      this.map!.on("load", async () => {
        this.isMapReady = true;
        await this.restoreState();

        const initProjection = this.model.get("projection") as string;
        if (initProjection && initProjection !== "mercator") {
          try {
            this.map!.setProjection({ type: initProjection } as any);
          } catch (err) {
            console.warn("Failed to set initial projection:", err);
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
   * Create the Mapbox map instance.
   */
  protected createMap(): MapboxGl.Map {
    const style = this.model.get("style");
    const center = this.model.get("center");
    const zoom = this.model.get("zoom");
    const bearing = this.model.get("bearing") || 0;
    const pitch = this.model.get("pitch") || 0;
    const maxPitchValue = this.model.get("max_pitch");
    const maxPitch = typeof maxPitchValue === "number" ? maxPitchValue : 85;

    // Create map options with access token
    const mapOptions: any = {
      container: this.mapContainer!,
      style: typeof style === "string" ? style : (style as any),
      center: center as [number, number],
      zoom,
      bearing,
      pitch,
      maxPitch,
      attributionControl: false,
    };

    // Add access token if provided
    if (this.accessToken) {
      mapOptions.accessToken = this.accessToken;
    }

    return new this.mapboxgl.Map(mapOptions);
  }

  /**
   * Set up map event listeners.
   */
  private setupMapEvents(): void {
    if (!this.map) return;

    this.map.on("click", (e: MapboxGl.MapMouseEvent) => {
      this.model.set("clicked", {
        lng: e.lngLat.lng,
        lat: e.lngLat.lat,
        point: [e.point.x, e.point.y],
      });
      this.sendEvent("click", {
        lngLat: [e.lngLat.lng, e.lngLat.lat],
        point: [e.point.x, e.point.y],
      });
      this.model.save_changes();
    });

    this.map.on("moveend", () => {
      if (!this.map) return;
      const center = this.map.getCenter();
      const bounds = this.map.getBounds();
      const zoom = this.map.getZoom();

      if (bounds) {
        this.model.set("current_center", [center.lng, center.lat]);
        this.model.set("current_zoom", zoom);
        this.model.set("current_bounds", [
          bounds.getWest(),
          bounds.getSouth(),
          bounds.getEast(),
          bounds.getNorth(),
        ]);
        this.model.save_changes();

        this.sendEvent("moveend", {
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

    this.map.on("zoomend", () => {
      if (!this.map) return;
      this.sendEvent("zoomend", { zoom: this.map.getZoom() });
    });
  }

  /**
   * Register all method handlers.
   */
  private registerMethods(): void {
    // Map navigation
    this.registerMethod("setCenter", this.handleSetCenter.bind(this));
    this.registerMethod("setZoom", this.handleSetZoom.bind(this));
    this.registerMethod("flyTo", this.handleFlyTo.bind(this));
    this.registerMethod("fitBounds", this.handleFitBounds.bind(this));

    // Sources and layers
    this.registerMethod("addSource", this.handleAddSource.bind(this));
    this.registerMethod("removeSource", this.handleRemoveSource.bind(this));
    this.registerMethod("addLayer", this.handleAddLayer.bind(this));
    this.registerMethod("removeLayer", this.handleRemoveLayer.bind(this));
    this.registerMethod("setVisibility", this.handleSetVisibility.bind(this));
    this.registerMethod("setOpacity", this.handleSetOpacity.bind(this));
    this.registerMethod("setPaintProperty", this.handleSetPaintProperty.bind(this));
    this.registerMethod("setLayoutProperty", this.handleSetLayoutProperty.bind(this));

    // Basemaps and data
    this.registerMethod("addBasemap", this.handleAddBasemap.bind(this));
    this.registerMethod("addGeoJSON", this.handleAddGeoJSON.bind(this));
    this.registerMethod("addTileLayer", this.handleAddTileLayer.bind(this));
    this.registerMethod("addImageLayer", this.handleAddImageLayer.bind(this));

    // Controls
    this.registerMethod("addControl", this.handleAddControl.bind(this));
    this.registerMethod("removeControl", this.handleRemoveControl.bind(this));
    this.registerMethod("addLayerControl", this.handleAddLayerControl.bind(this));

    // Markers
    this.registerMethod("addMarker", this.handleAddMarker.bind(this));
    this.registerMethod("addMarkers", this.handleAddMarkers.bind(this));
    this.registerMethod("removeMarker", this.handleRemoveMarker.bind(this));
    this.registerMethod("addPopup", this.handleAddPopup.bind(this));

    // Legend and terrain
    this.registerMethod("addLegend", this.handleAddLegend.bind(this));
    this.registerMethod("removeLegend", this.handleRemoveLegend.bind(this));
    this.registerMethod("updateLegend", this.handleUpdateLegend.bind(this));
    this.registerMethod("addTerrain", this.handleAddTerrain.bind(this));
    this.registerMethod("removeTerrain", this.handleRemoveTerrain.bind(this));
    this.registerMethod("moveLayer", this.handleMoveLayer.bind(this));

    // Draw control
    this.registerMethod("addDrawControl", this.handleAddDrawControl.bind(this));
    this.registerMethod("getDrawData", this.handleGetDrawData.bind(this));
    this.registerMethod("loadDrawData", this.handleLoadDrawData.bind(this));
    this.registerMethod("clearDrawData", this.handleClearDrawData.bind(this));

    // Projection
    this.registerMethod("setProjection", this.handleSetProjection.bind(this));

    // Deck.gl layers
    this.registerMethod("addCOGLayer", this.handleAddCOGLayer.bind(this));
    this.registerMethod("removeCOGLayer", this.handleRemoveCOGLayer.bind(this));
    this.registerMethod("addArcLayer", this.handleAddArcLayer.bind(this));
    this.registerMethod("removeArcLayer", this.handleRemoveArcLayer.bind(this));
    this.registerMethod("addPointCloudLayer", this.handleAddPointCloudLayer.bind(this));
    this.registerMethod("removePointCloudLayer", this.handleRemovePointCloudLayer.bind(this));
    this.registerMethod("addScatterplotLayer", this.handleAddScatterplotLayer.bind(this));
    this.registerMethod("addPathLayer", this.handleAddPathLayer.bind(this));
    this.registerMethod("addPolygonLayer", this.handleAddPolygonLayer.bind(this));
    this.registerMethod("addHexagonLayer", this.handleAddHexagonLayer.bind(this));
    this.registerMethod("addHeatmapLayer", this.handleAddHeatmapLayer.bind(this));
    this.registerMethod("addGridLayer", this.handleAddGridLayer.bind(this));
    this.registerMethod("addIconLayer", this.handleAddIconLayer.bind(this));
    this.registerMethod("addTextLayer", this.handleAddTextLayer.bind(this));
    this.registerMethod("addGeoJsonLayer", this.handleAddGeoJsonLayer.bind(this));
    this.registerMethod("addContourLayer", this.handleAddContourLayer.bind(this));
    this.registerMethod("addScreenGridLayer", this.handleAddScreenGridLayer.bind(this));
    this.registerMethod("addTripsLayer", this.handleAddTripsLayer.bind(this));
    this.registerMethod("addLineLayer", this.handleAddLineLayer.bind(this));
    this.registerMethod("addDeckGLLayer", this.handleAddDeckGLLayer.bind(this));
    this.registerMethod("removeDeckLayer", this.handleRemoveDeckLayer.bind(this));
    this.registerMethod("setDeckLayerVisibility", this.handleSetDeckLayerVisibility.bind(this));
    this.registerMethod("addBitmapLayer", this.handleAddBitmapLayer.bind(this));
    this.registerMethod("addColumnLayer", this.handleAddColumnLayer.bind(this));
    this.registerMethod("addGridCellLayer", this.handleAddGridCellLayer.bind(this));
    this.registerMethod("addSolidPolygonLayer", this.handleAddSolidPolygonLayer.bind(this));

    // Native Mapbox features
    this.registerMethod("updateGeoJSONSource", this.handleUpdateGeoJSONSource.bind(this));
    this.registerMethod("addMapImage", this.handleAddMapImage.bind(this));
    this.registerMethod("addTooltip", this.handleAddTooltip.bind(this));
    this.registerMethod("removeTooltip", this.handleRemoveTooltip.bind(this));
    this.registerMethod("addCoordinatesControl", this.handleAddCoordinatesControl.bind(this));
    this.registerMethod("removeCoordinatesControl", this.handleRemoveCoordinatesControl.bind(this));
    this.registerMethod("addTimeSlider", this.handleAddTimeSlider.bind(this));
    this.registerMethod("removeTimeSlider", this.handleRemoveTimeSlider.bind(this));
    this.registerMethod("addSwipeMap", this.handleAddSwipeMap.bind(this));
    this.registerMethod("removeSwipeMap", this.handleRemoveSwipeMap.bind(this));
    this.registerMethod("addOpacitySlider", this.handleAddOpacitySlider.bind(this));
    this.registerMethod("removeOpacitySlider", this.handleRemoveOpacitySlider.bind(this));
    this.registerMethod("addStyleSwitcher", this.handleAddStyleSwitcher.bind(this));
    this.registerMethod("removeStyleSwitcher", this.handleRemoveStyleSwitcher.bind(this));
    this.registerMethod("getVisibleFeatures", this.handleGetVisibleFeatures.bind(this));
    this.registerMethod("getLayerData", this.handleGetLayerData.bind(this));

    // UI controls
    this.registerMethod("addControlGrid", this.handleAddControlGrid.bind(this));

    // LiDAR
    this.registerMethod("addLidarControl", this.handleAddLidarControl.bind(this));
    this.registerMethod("addLidarLayer", this.handleAddLidarLayer.bind(this));
    this.registerMethod("removeLidarLayer", this.handleRemoveLidarLayer.bind(this));
    this.registerMethod("setLidarColorScheme", this.handleSetLidarColorScheme.bind(this));
    this.registerMethod("setLidarPointSize", this.handleSetLidarPointSize.bind(this));
    this.registerMethod("setLidarOpacity", this.handleSetLidarOpacity.bind(this));

    // PMTiles
    this.registerMethod("addPMTilesLayer", this.handleAddPMTilesLayer.bind(this));
    this.registerMethod("removePMTilesLayer", this.handleRemovePMTilesLayer.bind(this));
    this.registerMethod("addPMTilesControl", this.handleAddPMTilesControl.bind(this));
    this.registerMethod("addCogControl", this.handleAddCogControl.bind(this));
    this.registerMethod("addZarrControl", this.handleAddZarrControl.bind(this));
    this.registerMethod("addVectorControl", this.handleAddVectorControl.bind(this));

    // Clustering
    this.registerMethod("addClusterLayer", this.handleAddClusterLayer.bind(this));
    this.registerMethod("removeClusterLayer", this.handleRemoveClusterLayer.bind(this));
    this.registerMethod("addChoropleth", this.handleAddChoropleth.bind(this));
    this.registerMethod("add3DBuildings", this.handleAdd3DBuildings.bind(this));

    // Animation
    this.registerMethod("animateAlongRoute", this.handleAnimateAlongRoute.bind(this));
    this.registerMethod("stopAnimation", this.handleStopAnimation.bind(this));
    this.registerMethod("pauseAnimation", this.handlePauseAnimation.bind(this));
    this.registerMethod("resumeAnimation", this.handleResumeAnimation.bind(this));
    this.registerMethod("setAnimationSpeed", this.handleSetAnimationSpeed.bind(this));

    // Query
    this.registerMethod("queryRenderedFeatures", this.handleQueryRenderedFeatures.bind(this));
    this.registerMethod("querySourceFeatures", this.handleQuerySourceFeatures.bind(this));

    // Hover
    this.registerMethod("addHoverEffect", this.handleAddHoverEffect.bind(this));

    // Fog
    this.registerMethod("setFog", this.handleSetFog.bind(this));
    this.registerMethod("removeFog", this.handleRemoveFog.bind(this));

    // Filter
    this.registerMethod("setFilter", this.handleSetFilter.bind(this));

    // Video
    this.registerMethod("addVideoLayer", this.handleAddVideoLayer.bind(this));
    this.registerMethod("removeVideoLayer", this.handleRemoveVideoLayer.bind(this));
    this.registerMethod("playVideo", this.handlePlayVideo.bind(this));
    this.registerMethod("pauseVideo", this.handlePauseVideo.bind(this));
    this.registerMethod("seekVideo", this.handleSeekVideo.bind(this));

    // Split Map
    this.registerMethod("addSplitMap", this.handleAddSplitMap.bind(this));
    this.registerMethod("removeSplitMap", this.handleRemoveSplitMap.bind(this));

    // Zarr
    this.registerMethod("addZarrLayer", this.handleAddZarrLayer.bind(this));
    this.registerMethod("removeZarrLayer", this.handleRemoveZarrLayer.bind(this));
    this.registerMethod("updateZarrLayer", this.handleUpdateZarrLayer.bind(this));

    // Colorbar
    this.registerMethod("addColorbar", this.handleAddColorbar.bind(this));
    this.registerMethod("removeColorbar", this.handleRemoveColorbar.bind(this));
    this.registerMethod("updateColorbar", this.handleUpdateColorbar.bind(this));

    // Search, Measure, Print
    this.registerMethod("addSearchControl", this.handleAddSearchControl.bind(this));
    this.registerMethod("removeSearchControl", this.handleRemoveSearchControl.bind(this));
    this.registerMethod("addMeasureControl", this.handleAddMeasureControl.bind(this));
    this.registerMethod("removeMeasureControl", this.handleRemoveMeasureControl.bind(this));
    this.registerMethod("addPrintControl", this.handleAddPrintControl.bind(this));
    this.registerMethod("removePrintControl", this.handleRemovePrintControl.bind(this));

    // FlatGeobuf
    this.registerMethod("addFlatGeobuf", this.handleAddFlatGeobuf.bind(this));
    this.registerMethod("removeFlatGeobuf", this.handleRemoveFlatGeobuf.bind(this));
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
    this.map.flyTo(options as any);
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
      options as any
    );
  }

  // -------------------------------------------------------------------------
  // Source handlers
  // -------------------------------------------------------------------------

  private handleAddSource(args: unknown[], kwargs: Record<string, unknown>): void {
    if (!this.map) return;
    const [sourceId] = args as [string];

    if (this.map.getSource(sourceId)) {
      console.warn(`Source ${sourceId} already exists`);
      return;
    }

    this.map.addSource(sourceId, kwargs as any);
    this.stateManager.addSource(sourceId, kwargs as any);
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
    const config = kwargs as any;

    if (this.map.getLayer(config.id)) {
      console.warn(`Layer ${config.id} already exists`);
      return;
    }

    const beforeId = kwargs.beforeId as string | undefined;
    this.map.addLayer(config as any, beforeId);
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

    this.map.setLayoutProperty(layerId, "visibility", visible ? "visible" : "none");
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

    const type = (layer as any).type;
    const opacityProperty = this.getOpacityProperty(type);
    if (opacityProperty) {
      this.map.setPaintProperty(layerId, opacityProperty as any, opacity);
    }
    this.stateManager.setLayerOpacity(layerId, opacity);
  }

  private getOpacityProperty(layerType: string): string | null {
    const opacityMap: Record<string, string> = {
      fill: "fill-opacity",
      line: "line-opacity",
      circle: "circle-opacity",
      symbol: "icon-opacity",
      raster: "raster-opacity",
      "fill-extrusion": "fill-extrusion-opacity",
      heatmap: "heatmap-opacity",
    };
    return opacityMap[layerType] || null;
  }

  private handleSetPaintProperty(args: unknown[], kwargs: Record<string, unknown>): void {
    if (!this.map) return;
    const [layerId, property, value] = args as [string, string, unknown];

    if (!this.map.getLayer(layerId)) {
      return;
    }

    this.map.setPaintProperty(layerId, property as any, value);
  }

  private handleSetLayoutProperty(args: unknown[], kwargs: Record<string, unknown>): void {
    if (!this.map) return;
    const [layerId, property, value] = args as [string, string, unknown];

    if (!this.map.getLayer(layerId)) {
      return;
    }

    this.map.setLayoutProperty(layerId, property as any, value);
  }

  // -------------------------------------------------------------------------
  // Basemap handlers
  // -------------------------------------------------------------------------

  private handleAddBasemap(args: unknown[], kwargs: Record<string, unknown>): void {
    if (!this.map) return;
    const [url] = args as [string];
    const name = (kwargs.name as string) || "basemap";
    const attribution = (kwargs.attribution as string) || "";

    const sourceId = `basemap-${name}`;
    const layerId = `basemap-${name}`;

    if (!this.map.getSource(sourceId)) {
      this.map.addSource(sourceId, {
        type: "raster",
        tiles: [url],
        tileSize: 256,
        attribution,
      });
    }

    if (!this.map.getLayer(layerId)) {
      const layers = this.map.getStyle().layers || [];
      const firstSymbolId = layers.find((l: any) => l.type === "symbol")?.id;

      this.map.addLayer(
        {
          id: layerId,
          type: "raster",
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

    if (!this.map.getSource(sourceId)) {
      this.map.addSource(sourceId, {
        type: "geojson",
        data: geojson as GeoJSON.GeoJSON,
      });
    }

    let type = layerType;
    if (!type && geojson.type === "FeatureCollection" && geojson.features.length > 0) {
      const geometry = geojson.features[0].geometry;
      type = this.inferLayerType(geometry.type);
    } else if (!type && geojson.type === "Feature") {
      type = this.inferLayerType(geojson.geometry.type);
    }
    type = type || "circle";

    const defaultPaint = this.getDefaultPaint(type);
    const layerPaint = paint || defaultPaint;

    if (!this.map.getLayer(layerId)) {
      this.map.addLayer({
        id: layerId,
        type: type as any,
        source: sourceId,
        paint: layerPaint as any,
      });
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
      case "Point":
      case "MultiPoint":
        return "circle";
      case "LineString":
      case "MultiLineString":
        return "line";
      case "Polygon":
      case "MultiPolygon":
        return "fill";
      default:
        return "circle";
    }
  }

  private getDefaultPaint(layerType: string): Record<string, unknown> {
    const defaults: Record<string, Record<string, unknown>> = {
      circle: {
        "circle-radius": 5,
        "circle-color": "#3388ff",
        "circle-opacity": 0.8,
        "circle-stroke-width": 1,
        "circle-stroke-color": "#ffffff",
      },
      line: {
        "line-color": "#3388ff",
        "line-width": 2,
        "line-opacity": 0.8,
      },
      fill: {
        "fill-color": "#3388ff",
        "fill-opacity": 0.5,
        "fill-outline-color": "#0000ff",
      },
      raster: {
        "raster-opacity": 1,
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
    const attribution = (kwargs.attribution as string) || "";
    const minZoom = (kwargs.minZoom as number) || 0;
    const maxZoom = (kwargs.maxZoom as number) || 22;

    const sourceId = `${name}-source`;
    const layerId = name;

    if (!this.map.getSource(sourceId)) {
      this.map.addSource(sourceId, {
        type: "raster",
        tiles: [url],
        tileSize: 256,
        attribution,
        minzoom: minZoom,
        maxzoom: maxZoom,
      });
    }

    if (!this.map.getLayer(layerId)) {
      this.map.addLayer({
        id: layerId,
        type: "raster",
        source: sourceId,
        minzoom: minZoom,
        maxzoom: maxZoom,
      });
    }
  }

  private handleAddImageLayer(args: unknown[], kwargs: Record<string, unknown>): void {
    if (!this.map) return;
    const id = (kwargs.id as string) || `image-${Date.now()}`;
    const url = kwargs.url as string;
    const coordinates = kwargs.coordinates as number[][];
    const opacity = (kwargs.opacity as number) ?? 1.0;

    if (!url || !coordinates || coordinates.length !== 4) {
      console.error("addImageLayer requires url and 4 corner coordinates");
      return;
    }

    const sourceId = `${id}-source`;

    if (!this.map.getSource(sourceId)) {
      this.map.addSource(sourceId, {
        type: "image",
        url,
        coordinates: coordinates as [[number, number], [number, number], [number, number], [number, number]],
      });
    }

    if (!this.map.getLayer(id)) {
      this.map.addLayer({
        id,
        type: "raster",
        source: sourceId,
        paint: { "raster-opacity": opacity },
      });
    }
  }

  // -------------------------------------------------------------------------
  // Control handlers
  // -------------------------------------------------------------------------

  private handleAddControl(args: unknown[], kwargs: Record<string, unknown>): void {
    if (!this.map) return;
    const [controlType] = args as [string];
    const position = (kwargs.position as ControlPosition) || "top-right";

    let control: MapboxGl.IControl | null = null;

    switch (controlType) {
      case "navigation":
        control = new this.mapboxgl.NavigationControl({
          showCompass: kwargs.showCompass !== false,
          showZoom: kwargs.showZoom !== false,
          visualizePitch: kwargs.visualizePitch !== false,
        });
        break;
      case "scale":
        control = new this.mapboxgl.ScaleControl({
          maxWidth: (kwargs.maxWidth as number) || 100,
          unit: (kwargs.unit as "imperial" | "metric" | "nautical") || "metric",
        });
        break;
      case "fullscreen":
        control = new this.mapboxgl.FullscreenControl();
        break;
      case "geolocate":
        control = new this.mapboxgl.GeolocateControl({
          positionOptions: { enableHighAccuracy: true },
          trackUserLocation: kwargs.trackUserLocation !== false,
        });
        break;
      case "attribution":
        control = new this.mapboxgl.AttributionControl({
          compact: kwargs.compact !== false,
        });
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
    let layers = kwargs.layers as string[] | undefined;
    if (!layers || layers.length === 0) {
      const modelLayers = this.model.get("_layers") || {};
      layers = Object.keys(modelLayers);
    }
    const position = (kwargs.position as ControlPosition) || "top-right";
    const collapsed = (kwargs.collapsed as boolean) || false;

    const container = document.createElement("div");
    container.className = "mapboxgl-ctrl mapboxgl-ctrl-group anymap-layer-control";
    container.style.cssText = "padding:8px;background:rgba(255,255,255,0.95);border-radius:4px;max-height:200px;overflow-y:auto;";

    if (collapsed) {
      container.style.display = "none";
      const toggle = document.createElement("button");
      toggle.textContent = "Layers";
      toggle.style.cssText = "padding:4px 8px;cursor:pointer;border:1px solid #ccc;border-radius:3px;background:#fff;";
      toggle.addEventListener("click", () => {
        container.style.display = container.style.display === "none" ? "block" : "none";
      });
      const wrapper = document.createElement("div");
      wrapper.className = "mapboxgl-ctrl mapboxgl-ctrl-group";
      wrapper.appendChild(toggle);
      wrapper.appendChild(container);
      this.map.getContainer().querySelector(`.mapboxgl-ctrl-${position}`)?.appendChild(wrapper);
    } else {
      this.map.getContainer().querySelector(`.mapboxgl-ctrl-${position}`)?.appendChild(container);
    }

    const style = this.map.getStyle();
    const layersList = style?.layers || [];
    for (const layer of layersList) {
      if (layers && layers.length > 0 && !layers.includes(layer.id)) continue;
      if (layer.id.startsWith("mapbox-") || layer.id.startsWith("maplibre-")) continue;

      const row = document.createElement("div");
      row.style.cssText = "display:flex;align-items:center;margin-bottom:4px;";
      const cb = document.createElement("input");
      cb.type = "checkbox";
      cb.checked = (layer.layout as Record<string, unknown>)?.["visibility"] !== "none";
      cb.addEventListener("change", () => {
        this.map?.setLayoutProperty(layer.id, "visibility", cb.checked ? "visible" : "none");
      });
      const label = document.createElement("span");
      label.textContent = layer.id;
      label.style.marginLeft = "6px";
      row.appendChild(cb);
      row.appendChild(label);
      container.appendChild(row);
    }
  }

  private async handleAddDrawControl(args: unknown[], kwargs: Record<string, unknown>): Promise<void> {
    if (!this.map) return;
    const position = (kwargs.position as ControlPosition) || "top-right";

    if (this.mapboxDraw) {
      this.map.removeControl(this.mapboxDraw as unknown as MapboxGl.IControl);
    }

    const MapboxDraw = await loadMapboxDraw();
    this.mapboxDraw = new MapboxDraw({
      displayControlsDefault: false,
      controls: {
        point: true,
        line_string: true,
        polygon: true,
        trash: true,
      },
    });
    this.map.addControl(this.mapboxDraw as unknown as MapboxGl.IControl, position);

    this.map.on("draw.create", () => this.syncDrawData());
    this.map.on("draw.update", () => this.syncDrawData());
    this.map.on("draw.delete", () => this.syncDrawData());
  }

  private syncDrawData(): void {
    if (!this.mapboxDraw) return;
    const data = this.mapboxDraw.getAll();
    this.model.set("_draw_data", data);
    this.model.save_changes();
  }

  private handleGetDrawData(args: unknown[], kwargs: Record<string, unknown>): void {
    if (!this.mapboxDraw) {
      this.model.set("_draw_data", { type: "FeatureCollection", features: [] });
      this.model.save_changes();
      return;
    }
    const data = this.mapboxDraw.getAll();
    this.model.set("_draw_data", data);
    this.model.save_changes();
  }

  private handleLoadDrawData(args: unknown[], kwargs: Record<string, unknown>): void {
    if (!this.mapboxDraw) {
      console.warn("Draw control not initialized");
      return;
    }
    const geojson = args[0] as FeatureCollection;
    this.mapboxDraw.set(geojson);
  }

  private handleClearDrawData(args: unknown[], kwargs: Record<string, unknown>): void {
    if (!this.mapboxDraw) return;
    this.mapboxDraw.deleteAll();
    this.model.set("_draw_data", { type: "FeatureCollection", features: [] });
    this.model.save_changes();
  }

  // -------------------------------------------------------------------------
  // Terrain handlers (Mapbox-specific)
  // -------------------------------------------------------------------------

  private handleAddTerrain(args: unknown[], kwargs: Record<string, unknown>): void {
    if (!this.map) return;

    const sourceId = (kwargs.source as string) || "mapbox-dem";
    const exaggeration = (kwargs.exaggeration as number) || 1;

    // Add terrain source if not exists
    if (!this.map.getSource(sourceId)) {
      this.map.addSource(sourceId, {
        type: "raster-dem",
        url: "mapbox://mapbox.mapbox-terrain-dem-v1",
        tileSize: 512,
        maxzoom: 14,
      });
    }

    // Set terrain
    this.map.setTerrain({ source: sourceId, exaggeration } as any);
  }

  private handleRemoveTerrain(args: unknown[], kwargs: Record<string, unknown>): void {
    if (!this.map) return;
    this.map.setTerrain(null as any);
  }

  // -------------------------------------------------------------------------
  // Marker handlers
  // -------------------------------------------------------------------------

  private handleAddMarker(args: unknown[], kwargs: Record<string, unknown>): void {
    if (!this.map) return;
    const [lng, lat] = args as [number, number];
    const id = (kwargs.id as string) || `marker-${Date.now()}`;
    const color = (kwargs.color as string) || "#3388ff";
    const popup = kwargs.popup as string | undefined;

    const marker = new this.mapboxgl.Marker({ color }).setLngLat([lng, lat]);

    if (popup) {
      marker.setPopup(new this.mapboxgl.Popup().setHTML(popup));
    }

    marker.addTo(this.map);
    this.markersMap.set(id, marker);
  }

  private handleAddMarkers(args: unknown[], kwargs: Record<string, unknown>): void {
    if (!this.map) return;
    const id = (kwargs.id as string) || `markers-${Date.now()}`;
    const markers = kwargs.markers as Array<{ lngLat: [number, number]; popup?: string; tooltip?: string }>;
    const color = (kwargs.color as string) || "#3388ff";
    if (!markers || !Array.isArray(markers)) return;
    for (let i = 0; i < markers.length; i++) {
      const m = markers[i];
      const markerId = `${id}-${i}`;
      const marker = new this.mapboxgl.Marker({ color }).setLngLat(m.lngLat);
      if (m.popup) marker.setPopup(new this.mapboxgl.Popup().setHTML(m.popup));
      marker.addTo(this.map);
      this.markersMap.set(markerId, marker);
    }
  }

  private handleRemoveMarker(args: unknown[], kwargs: Record<string, unknown>): void {
    const [id] = args as [string];
    const marker = this.markersMap.get(id);
    if (marker) {
      marker.remove();
      this.markersMap.delete(id);
    }
  }

  private handleAddPopup(args: unknown[], kwargs: Record<string, unknown>): void {
    if (!this.map) return;
    const layerId = kwargs.layerId as string;
    const properties = kwargs.properties as string[] | undefined;
    const template = kwargs.template as string | undefined;
    if (!layerId) return;
    this.map.on("click", layerId, (e: any) => {
      if (!e.features || e.features.length === 0) return;
      const feature = e.features[0];
      const props = feature.properties || {};
      let content: string;
      if (template) {
        content = template.replace(/\{(\w+)\}/g, (_, key) => (props[key] !== undefined ? String(props[key]) : ""));
      } else if (properties) {
        content = properties.filter((k) => props[k] !== undefined).map((k) => `${k}: ${props[k]}`).join("<br>");
      } else {
        content = Object.entries(props).map(([k, v]) => `${k}: ${v}`).join("<br>");
      }
      new this.mapboxgl.Popup().setLngLat(e.lngLat).setHTML(content).addTo(this.map!);
    });
    this.map.on("mouseenter", layerId, () => { if (this.map) this.map.getCanvas().style.cursor = "pointer"; });
    this.map.on("mouseleave", layerId, () => { if (this.map) this.map.getCanvas().style.cursor = ""; });
  }

  private handleAddLegend(args: unknown[], kwargs: Record<string, unknown>): void {
    if (!this.map) return;
    const legendId = (kwargs.id as string) || `legend-${Date.now()}`;
    const title = (kwargs.title as string) || "Legend";
    const items = (kwargs.items as Array<{ label: string; color: string }>) || [];
    const position = (kwargs.position as string) || "bottom-right";
    if (this.legendsMap.has(legendId)) {
      const old = this.legendsMap.get(legendId);
      if (old?.parentNode) old.parentNode.removeChild(old);
      this.legendsMap.delete(legendId);
    }
    const legendDiv = document.createElement("div");
    legendDiv.id = legendId;
    legendDiv.className = "mapboxgl-ctrl legend-control";
    legendDiv.style.cssText = "padding:10px 14px;border-radius:4px;box-shadow:0 1px 4px rgba(0,0,0,0.3);font-size:12px;max-width:200px;background:rgba(255,255,255,0.95);";
    const titleEl = document.createElement("div");
    titleEl.style.cssText = "font-weight:bold;margin-bottom:8px;";
    titleEl.textContent = title;
    legendDiv.appendChild(titleEl);
    for (const item of items) {
      const row = document.createElement("div");
      row.style.cssText = "display:flex;align-items:center;margin-bottom:4px;";
      const colorBox = document.createElement("span");
      colorBox.style.cssText = `width:16px;height:16px;background:${item.color};margin-right:8px;border-radius:2px;`;
      row.appendChild(colorBox);
      const label = document.createElement("span");
      label.textContent = item.label;
      row.appendChild(label);
      legendDiv.appendChild(row);
    }
    this.map.getContainer().querySelector(`.mapboxgl-ctrl-${position}`)?.appendChild(legendDiv);
    this.legendsMap.set(legendId, legendDiv);
  }

  private handleRemoveLegend(args: unknown[], kwargs: Record<string, unknown>): void {
    const legendId = args[0] as string | undefined;
    if (legendId) {
      const legendDiv = this.legendsMap.get(legendId);
      if (legendDiv?.parentNode) legendDiv.parentNode.removeChild(legendDiv);
      this.legendsMap.delete(legendId);
    } else {
      for (const [, div] of this.legendsMap) {
        if (div.parentNode) div.parentNode.removeChild(div);
      }
      this.legendsMap.clear();
    }
  }

  private handleUpdateLegend(args: unknown[], kwargs: Record<string, unknown>): void {
    const legendId = (kwargs.id as string) || (args[0] as string);
    if (!legendId) return;
    const legendDiv = this.legendsMap.get(legendId);
    if (!legendDiv) return;
    const title = kwargs.title as string | undefined;
    const items = kwargs.items as Array<{ label: string; color: string }> | undefined;
    if (title) {
      const titleEl = legendDiv.querySelector("div");
      if (titleEl) titleEl.textContent = title;
    }
    if (items && items.length > 0) {
      legendDiv.querySelectorAll("div:not(:first-child)").forEach((r: any) => r.remove());
      for (const item of items) {
        const row = document.createElement("div");
        row.style.cssText = "display:flex;align-items:center;margin-bottom:4px;";
        const colorBox = document.createElement("span");
        colorBox.style.cssText = `width:16px;height:16px;background:${item.color};margin-right:8px;border-radius:2px;`;
        row.appendChild(colorBox);
        const label = document.createElement("span");
        label.textContent = item.label;
        row.appendChild(label);
        legendDiv.appendChild(row);
      }
    }
  }

  private handleMoveLayer(args: unknown[], kwargs: Record<string, unknown>): void {
    if (!this.map) return;
    const [layerId, beforeId] = args as [string, string | undefined];
    if (layerId && this.map.getLayer(layerId)) this.map.moveLayer(layerId, beforeId);
  }

  // -------------------------------------------------------------------------
  // COG layer handlers (deck.gl)
  // -------------------------------------------------------------------------

  private async initializeDeckOverlay(): Promise<void> {
    if (this.deckOverlay || !this.map) return;
    const { mapbox } = await loadDeckGl();
    this.deckOverlay = new mapbox.MapboxOverlay({ layers: [] });
    this.map.addControl(this.deckOverlay as unknown as MapboxGl.IControl);
  }

  private updateDeckOverlay(): void {
    if (this.deckOverlay) {
      const layers = Array.from(this.deckLayers.values()) as (false | null | undefined)[];
      this.deckOverlay.setProps({ layers });
    }
  }

  private async handleAddCOGLayer(args: unknown[], kwargs: Record<string, unknown>): Promise<void> {
    if (!this.map) return;
    await this.initializeDeckOverlay();
    const id = (kwargs.id as string) || `cog-${Date.now()}`;
    const geotiff = kwargs.geotiff as string;
    const fitBounds = kwargs.fitBounds !== false;

    const [{ proj }, { toProj4 }] = await Promise.all([loadGeotiff(), loadGeokeysParser()]);
    const geoKeysParser = async (geoKeys: Record<string, unknown>) => {
      const projDefinition = toProj4(geoKeys as any);
      return {
        def: projDefinition.proj4,
        parsed: proj.parseCrs(projDefinition.proj4),
        coordinatesUnits: projDefinition.coordinatesUnits as any,
      };
    };

    const { COGLayer } = await loadGeotiff();
    const layer = new COGLayer({
      id,
      geotiff,
      opacity: (kwargs.opacity as number) ?? 1,
      visible: kwargs.visible !== false,
      debug: (kwargs.debug as boolean) ?? false,
      debugOpacity: (kwargs.debugOpacity as number) ?? 0.25,
      maxError: (kwargs.maxError as number) ?? 0.125,
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
  }

  private handleRemoveCOGLayer(args: unknown[], kwargs: Record<string, unknown>): void {
    const [id] = args as [string];
    this.deckLayers.delete(id);
    this.updateDeckOverlay();
  }

  // -------------------------------------------------------------------------
  // Zarr layer handlers
  // -------------------------------------------------------------------------

  private async handleAddZarrLayer(args: unknown[], kwargs: Record<string, unknown>): Promise<void> {
    if (!this.map) return;
    const id = (kwargs.id as string) || `zarr-${Date.now()}`;
    const source = kwargs.source as string;
    const variable = kwargs.variable as string;
    const clim = (kwargs.clim as [number, number]) || [0, 100];
    const colormap = (kwargs.colormap as string[]) || ["#000000", "#ffffff"];
    const opacity = (kwargs.opacity as number) ?? 1;

    const { ZarrLayer } = await loadZarrLayer();
    const layer = new ZarrLayer({
      id,
      source,
      variable,
      clim,
      colormap,
      selector: (kwargs.selector as Record<string, number>) || {},
      opacity,
      minzoom: kwargs.minzoom as number,
      maxzoom: kwargs.maxzoom as number,
      fillValue: kwargs.fillValue as number,
      spatialDimensions: kwargs.spatialDimensions as { lat?: string; lon?: string },
      zarrVersion: kwargs.zarrVersion as 2 | 3 | undefined,
      bounds: kwargs.bounds as [number, number, number, number] | undefined,
    });
    this.map.addLayer(layer as unknown as MapboxGl.CustomLayerInterface);
    this.zarrLayers.set(id, layer);
  }

  private handleRemoveZarrLayer(args: unknown[], kwargs: Record<string, unknown>): void {
    const [id] = args as [string];
    if (this.map?.getLayer(id)) this.map.removeLayer(id);
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

  // -------------------------------------------------------------------------
  // Arc layer handlers (deck.gl)
  // -------------------------------------------------------------------------

  private async handleAddArcLayer(args: unknown[], kwargs: Record<string, unknown>): Promise<void> {
    if (!this.map) return;
    await this.initializeDeckOverlay();
    const id = (kwargs.id as string) || `arc-${Date.now()}`;
    const data = kwargs.data as unknown[];
    const { layers } = await loadDeckGl();

    const makeAccessor = (value: unknown, defaultProp: string, fallbackFn?: (d: any) => any): any => {
      if (typeof value === "string") return (d: any) => d[value];
      if (typeof value === "function") return value;
      if (value !== undefined && value !== null) return value;
      return fallbackFn || ((d: any) => d[defaultProp]);
    };

    const layer = new layers.ArcLayer({
      id,
      data,
      pickable: kwargs.pickable !== false,
      opacity: (kwargs.opacity as number) ?? 0.8,
      getWidth: makeAccessor(kwargs.getWidth ?? kwargs.width, "width", () => 1),
      getSourcePosition: makeAccessor(kwargs.getSourcePosition, "source", (d: any) => d.source || d.from || d.sourcePosition),
      getTargetPosition: makeAccessor(kwargs.getTargetPosition, "target", (d: any) => d.target || d.to || d.targetPosition),
      getSourceColor: makeAccessor(kwargs.getSourceColor ?? kwargs.sourceColor, "sourceColor", () => [51, 136, 255, 255]),
      getTargetColor: makeAccessor(kwargs.getTargetColor ?? kwargs.targetColor, "targetColor", () => [255, 136, 51, 255]),
      getHeight: makeAccessor(kwargs.getHeight ?? kwargs.height, "height", () => 1),
      greatCircle: (kwargs.greatCircle as boolean) ?? false,
    } as any);

    this.deckLayers.set(id, layer);
    this.updateDeckOverlay();
  }

  private handleRemoveArcLayer(args: unknown[], kwargs: Record<string, unknown>): void {
    const [id] = args as [string];
    this.deckLayers.delete(id);
    this.updateDeckOverlay();
  }

  // -------------------------------------------------------------------------
  // PointCloud layer handlers (deck.gl)
  // -------------------------------------------------------------------------

  private async handleAddPointCloudLayer(args: unknown[], kwargs: Record<string, unknown>): Promise<void> {
    if (!this.map) return;
    await this.initializeDeckOverlay();
    const id = (kwargs.id as string) || `pointcloud-${Date.now()}`;
    const data = kwargs.data as unknown[];
    const { layers } = await loadDeckGl();

    const makeAccessor = (value: unknown, defaultProp: string, fallbackFn?: (d: any) => any): any => {
      if (typeof value === "string") return (d: any) => d[value];
      if (typeof value === "function") return value;
      if (value !== undefined && value !== null) return value;
      return fallbackFn || ((d: any) => d[defaultProp]);
    };

    const layerProps: Record<string, unknown> = {
      id,
      data,
      pickable: kwargs.pickable !== false,
      opacity: (kwargs.opacity as number) ?? 1,
      pointSize: (kwargs.pointSize as number) ?? 2,
      getPosition: makeAccessor(kwargs.getPosition, "position", (d: any) => d.position || d.coordinates || [d.x, d.y, d.z]),
      getNormal: makeAccessor(kwargs.getNormal, "normal", () => [0, 0, 1]),
      getColor: makeAccessor(kwargs.getColor ?? kwargs.color, "color", () => [255, 255, 255, 255]),
      sizeUnits: (kwargs.sizeUnits as "pixels" | "meters" | "common") ?? "pixels",
    };

    if (kwargs.coordinateSystem !== undefined && kwargs.coordinateSystem !== null) {
      layerProps.coordinateSystem = kwargs.coordinateSystem as number;
    }
    if (kwargs.coordinateOrigin !== undefined && kwargs.coordinateOrigin !== null) {
      layerProps.coordinateOrigin = kwargs.coordinateOrigin as [number, number, number];
    }

    const layer = new layers.PointCloudLayer(layerProps as any);
    this.deckLayers.set(id, layer);
    this.updateDeckOverlay();
  }

  private handleRemovePointCloudLayer(args: unknown[], kwargs: Record<string, unknown>): void {
    const [id] = args as [string];
    this.deckLayers.delete(id);
    this.updateDeckOverlay();
  }

  // -------------------------------------------------------------------------
  // Additional deck.gl layer handlers
  // -------------------------------------------------------------------------

  private makeDeckAccessor(value: unknown, defaultProp: string, fallbackFn?: (d: any) => any): any {
    if (typeof value === "string") return (d: any) => d[value];
    if (typeof value === "function") return value;
    if (value !== undefined && value !== null) return value;
    return fallbackFn || ((d: any) => d[defaultProp]);
  }

  private async handleAddScatterplotLayer(args: unknown[], kwargs: Record<string, unknown>): Promise<void> {
    if (!this.map) return;
    await this.initializeDeckOverlay();
    const { layers } = await loadDeckGl();
    const id = (kwargs.id as string) || `scatterplot-${Date.now()}`;
    const data = kwargs.data as unknown[];
    const layer = new layers.ScatterplotLayer({
      id,
      data,
      pickable: kwargs.pickable !== false,
      opacity: (kwargs.opacity as number) ?? 0.8,
      getPosition: (kwargs.getPosition as (d: unknown) => [number, number]) ?? ((d: any) => d.coordinates || d.position || [d.lng || d.longitude, d.lat || d.latitude]),
      getRadius: (kwargs.getRadius as number) ?? (kwargs.radius as number) ?? 5,
      getFillColor: (kwargs.getFillColor as [number, number, number, number]) ?? [51, 136, 255, 200],
    } as any);
    this.deckLayers.set(id, layer);
    this.updateDeckOverlay();
  }

  private async handleAddPathLayer(args: unknown[], kwargs: Record<string, unknown>): Promise<void> {
    if (!this.map) return;
    await this.initializeDeckOverlay();
    const { layers } = await loadDeckGl();
    const id = (kwargs.id as string) || `path-${Date.now()}`;
    const data = kwargs.data as unknown[];
    const layer = new layers.PathLayer({
      id,
      data,
      getPath: (kwargs.getPath as (d: unknown) => [number, number][]) ?? ((d: any) => d.path || d.coordinates),
      getColor: (kwargs.getColor as [number, number, number, number]) ?? [51, 136, 255, 200],
      getWidth: (kwargs.getWidth as number) ?? 1,
    } as any);
    this.deckLayers.set(id, layer);
    this.updateDeckOverlay();
  }

  private async handleAddPolygonLayer(args: unknown[], kwargs: Record<string, unknown>): Promise<void> {
    if (!this.map) return;
    await this.initializeDeckOverlay();
    const { layers } = await loadDeckGl();
    const id = (kwargs.id as string) || `polygon-${Date.now()}`;
    const data = kwargs.data as unknown[];
    const layer = new layers.PolygonLayer({
      id,
      data,
      getPolygon: (kwargs.getPolygon as (d: unknown) => number[][][]) ?? ((d: any) => d.polygon || d.coordinates),
      getFillColor: (kwargs.getFillColor as [number, number, number, number]) ?? [51, 136, 255, 128],
    } as any);
    this.deckLayers.set(id, layer);
    this.updateDeckOverlay();
  }

  private async handleAddHexagonLayer(args: unknown[], kwargs: Record<string, unknown>): Promise<void> {
    if (!this.map) return;
    await this.initializeDeckOverlay();
    const { aggregationLayers } = await loadDeckGl();
    const id = (kwargs.id as string) || `hexagon-${Date.now()}`;
    const data = kwargs.data as unknown[];
    const layer = new aggregationLayers.HexagonLayer({
      id,
      data,
      getPosition: (kwargs.getPosition as (d: unknown) => [number, number]) ?? ((d: any) => d.coordinates || [d.lng, d.lat]),
      radius: (kwargs.radius as number) ?? 1000,
      elevationScale: (kwargs.elevationScale as number) ?? 4,
    } as any);
    this.deckLayers.set(id, layer);
    this.updateDeckOverlay();
  }

  private async handleAddHeatmapLayer(args: unknown[], kwargs: Record<string, unknown>): Promise<void> {
    if (!this.map) return;
    await this.initializeDeckOverlay();
    const { aggregationLayers } = await loadDeckGl();
    const id = (kwargs.id as string) || `heatmap-${Date.now()}`;
    const data = kwargs.data as unknown[];
    const layer = new aggregationLayers.HeatmapLayer({
      id,
      data,
      getPosition: (kwargs.getPosition as (d: unknown) => [number, number]) ?? ((d: any) => d.coordinates || [d.lng, d.lat]),
      getWeight: (kwargs.getWeight as number) ?? 1,
    } as any);
    this.deckLayers.set(id, layer);
    this.updateDeckOverlay();
  }

  private async handleAddGridLayer(args: unknown[], kwargs: Record<string, unknown>): Promise<void> {
    if (!this.map) return;
    await this.initializeDeckOverlay();
    const { aggregationLayers } = await loadDeckGl();
    const id = (kwargs.id as string) || `grid-${Date.now()}`;
    const data = kwargs.data as unknown[];
    const layer = new aggregationLayers.GridLayer({
      id,
      data,
      getPosition: (kwargs.getPosition as (d: unknown) => [number, number]) ?? ((d: any) => d.coordinates || [d.lng, d.lat]),
      cellSize: (kwargs.cellSize as number) ?? 200,
    } as any);
    this.deckLayers.set(id, layer);
    this.updateDeckOverlay();
  }

  private async handleAddIconLayer(args: unknown[], kwargs: Record<string, unknown>): Promise<void> {
    if (!this.map) return;
    await this.initializeDeckOverlay();
    const { layers } = await loadDeckGl();
    const id = (kwargs.id as string) || `icon-${Date.now()}`;
    const data = kwargs.data as unknown[];
    const layer = new layers.IconLayer({
      id,
      data,
      iconAtlas: kwargs.iconAtlas as string,
      iconMapping: kwargs.iconMapping as Record<string, unknown>,
      getPosition: (kwargs.getPosition as (d: unknown) => [number, number]) ?? ((d: any) => d.coordinates || [d.lng, d.lat]),
      getIcon: (kwargs.getIcon as (d: unknown) => string) ?? (() => "marker"),
    } as any);
    this.deckLayers.set(id, layer);
    this.updateDeckOverlay();
  }

  private async handleAddTextLayer(args: unknown[], kwargs: Record<string, unknown>): Promise<void> {
    if (!this.map) return;
    await this.initializeDeckOverlay();
    const { layers } = await loadDeckGl();
    const id = (kwargs.id as string) || `text-${Date.now()}`;
    const data = kwargs.data as unknown[];
    const layer = new layers.TextLayer({
      id,
      data,
      getPosition: (kwargs.getPosition as (d: unknown) => [number, number]) ?? ((d: any) => d.coordinates || [d.lng, d.lat]),
      getText: (kwargs.getText as (d: unknown) => string) ?? ((d: any) => d.text || d.label || ""),
    } as any);
    this.deckLayers.set(id, layer);
    this.updateDeckOverlay();
  }

  private async handleAddGeoJsonLayer(args: unknown[], kwargs: Record<string, unknown>): Promise<void> {
    if (!this.map) return;
    await this.initializeDeckOverlay();
    const { layers } = await loadDeckGl();
    const id = (kwargs.id as string) || `geojson-${Date.now()}`;
    const data = kwargs.data as unknown;
    const layer = new layers.GeoJsonLayer({
      id,
      data,
      getFillColor: (kwargs.getFillColor as [number, number, number, number]) ?? [51, 136, 255, 128],
    } as any);
    this.deckLayers.set(id, layer);
    this.updateDeckOverlay();
  }

  private async handleAddContourLayer(args: unknown[], kwargs: Record<string, unknown>): Promise<void> {
    if (!this.map) return;
    await this.initializeDeckOverlay();
    const { aggregationLayers } = await loadDeckGl();
    const id = (kwargs.id as string) || `contour-${Date.now()}`;
    const data = kwargs.data as unknown[];
    const layer = new aggregationLayers.ContourLayer({
      id,
      data,
      getPosition: (kwargs.getPosition as (d: unknown) => [number, number]) ?? ((d: any) => d.coordinates || [d.lng, d.lat]),
    } as any);
    this.deckLayers.set(id, layer);
    this.updateDeckOverlay();
  }

  private async handleAddScreenGridLayer(args: unknown[], kwargs: Record<string, unknown>): Promise<void> {
    if (!this.map) return;
    await this.initializeDeckOverlay();
    const { aggregationLayers } = await loadDeckGl();
    const id = (kwargs.id as string) || `screengrid-${Date.now()}`;
    const data = kwargs.data as unknown[];
    const layer = new aggregationLayers.ScreenGridLayer({
      id,
      data,
      getPosition: (kwargs.getPosition as (d: unknown) => [number, number]) ?? ((d: any) => d.coordinates || [d.lng, d.lat]),
    } as any);
    this.deckLayers.set(id, layer);
    this.updateDeckOverlay();
  }

  private async handleAddTripsLayer(args: unknown[], kwargs: Record<string, unknown>): Promise<void> {
    if (!this.map) return;
    await this.initializeDeckOverlay();
    const { geoLayers } = await loadDeckGl();
    const id = (kwargs.id as string) || `trips-${Date.now()}`;
    const data = kwargs.data as unknown[];
    const layer = new geoLayers.TripsLayer({
      id,
      data,
      getPath: this.makeDeckAccessor(kwargs.getPath, "waypoints", (d: any) => d.waypoints || d.path),
      getTimestamps: this.makeDeckAccessor(kwargs.getTimestamps, "timestamps", (d: any) => d.timestamps),
    } as any);
    this.deckLayers.set(id, layer);
    this.updateDeckOverlay();
  }

  private async handleAddLineLayer(args: unknown[], kwargs: Record<string, unknown>): Promise<void> {
    if (!this.map) return;
    await this.initializeDeckOverlay();
    const { layers } = await loadDeckGl();
    const id = (kwargs.id as string) || `line-${Date.now()}`;
    const data = kwargs.data as unknown[];
    const layer = new layers.LineLayer({
      id,
      data,
      getSourcePosition: this.makeDeckAccessor(kwargs.getSourcePosition, "source", (d: any) => d.source || d.from),
      getTargetPosition: this.makeDeckAccessor(kwargs.getTargetPosition, "target", (d: any) => d.target || d.to),
      getColor: this.makeDeckAccessor(kwargs.getColor, "color", () => [51, 136, 255, 200]),
    } as any);
    this.deckLayers.set(id, layer);
    this.updateDeckOverlay();
  }

  private async handleAddDeckGLLayer(args: unknown[], kwargs: Record<string, unknown>): Promise<void> {
    const layerType = kwargs.layerType as string;
    const handlerMap: Record<string, (a: unknown[], k: Record<string, unknown>) => Promise<void>> = {
      ScatterplotLayer: this.handleAddScatterplotLayer.bind(this),
      ArcLayer: this.handleAddArcLayer.bind(this),
      PathLayer: this.handleAddPathLayer.bind(this),
      PolygonLayer: this.handleAddPolygonLayer.bind(this),
      HexagonLayer: this.handleAddHexagonLayer.bind(this),
      HeatmapLayer: this.handleAddHeatmapLayer.bind(this),
      GridLayer: this.handleAddGridLayer.bind(this),
      IconLayer: this.handleAddIconLayer.bind(this),
      TextLayer: this.handleAddTextLayer.bind(this),
      GeoJsonLayer: this.handleAddGeoJsonLayer.bind(this),
      ContourLayer: this.handleAddContourLayer.bind(this),
      ScreenGridLayer: this.handleAddScreenGridLayer.bind(this),
      PointCloudLayer: this.handleAddPointCloudLayer.bind(this),
      TripsLayer: this.handleAddTripsLayer.bind(this),
      LineLayer: this.handleAddLineLayer.bind(this),
      BitmapLayer: this.handleAddBitmapLayer.bind(this),
      ColumnLayer: this.handleAddColumnLayer.bind(this),
      GridCellLayer: this.handleAddGridCellLayer.bind(this),
      SolidPolygonLayer: this.handleAddSolidPolygonLayer.bind(this),
    };
    const handler = handlerMap[layerType];
    if (handler) await handler(args, kwargs);
  }

  private handleRemoveDeckLayer(args: unknown[], kwargs: Record<string, unknown>): void {
    const id = (args[0] as string) || (kwargs.id as string);
    if (id) {
      this.deckLayers.delete(id);
      this.updateDeckOverlay();
    }
  }

  private handleSetDeckLayerVisibility(args: unknown[], kwargs: Record<string, unknown>): void {
    const id = (args[0] as string) || (kwargs.id as string);
    const visible = (args[1] as boolean) ?? (kwargs.visible as boolean) ?? true;
    if (!id) return;
    const layer = this.deckLayers.get(id) as { clone?: (p: Record<string, unknown>) => unknown } | undefined;
    if (layer?.clone) {
      this.deckLayers.set(id, layer.clone({ visible }));
      this.updateDeckOverlay();
    }
  }

  private async handleAddBitmapLayer(args: unknown[], kwargs: Record<string, unknown>): Promise<void> {
    if (!this.map) return;
    await this.initializeDeckOverlay();
    const { layers } = await loadDeckGl();
    const id = (kwargs.id as string) || `bitmap-${Date.now()}`;
    const layer = new layers.BitmapLayer({
      id,
      image: kwargs.image as string,
      bounds: kwargs.bounds as [number, number, number, number],
    });
    this.deckLayers.set(id, layer);
    this.updateDeckOverlay();
  }

  private async handleAddColumnLayer(args: unknown[], kwargs: Record<string, unknown>): Promise<void> {
    if (!this.map) return;
    await this.initializeDeckOverlay();
    const { layers } = await loadDeckGl();
    const id = (kwargs.id as string) || `column-${Date.now()}`;
    const data = kwargs.data as unknown[];
    const layer = new layers.ColumnLayer({
      id,
      data,
      getPosition: this.makeDeckAccessor(kwargs.getPosition, "coordinates", (d: any) => d.coordinates || [d.lng, d.lat]),
      getElevation: this.makeDeckAccessor(kwargs.getElevation, "elevation", () => 1000),
    } as any);
    this.deckLayers.set(id, layer);
    this.updateDeckOverlay();
  }

  private async handleAddGridCellLayer(args: unknown[], kwargs: Record<string, unknown>): Promise<void> {
    if (!this.map) return;
    await this.initializeDeckOverlay();
    const { layers } = await loadDeckGl();
    const id = (kwargs.id as string) || `gridcell-${Date.now()}`;
    const data = kwargs.data as unknown[];
    const layer = new layers.GridCellLayer({
      id,
      data,
      getPosition: this.makeDeckAccessor(kwargs.getPosition, "coordinates", (d: any) => d.coordinates || [d.lng, d.lat]),
    } as any);
    this.deckLayers.set(id, layer);
    this.updateDeckOverlay();
  }

  private async handleAddSolidPolygonLayer(args: unknown[], kwargs: Record<string, unknown>): Promise<void> {
    if (!this.map) return;
    await this.initializeDeckOverlay();
    const { layers } = await loadDeckGl();
    const id = (kwargs.id as string) || `solidpolygon-${Date.now()}`;
    const data = kwargs.data as unknown[];
    const layer = new layers.SolidPolygonLayer({
      id,
      data,
      getPolygon: this.makeDeckAccessor(kwargs.getPolygon, "polygon", (d: any) => d.polygon || d.coordinates),
    } as any);
    this.deckLayers.set(id, layer);
    this.updateDeckOverlay();
  }


  // -------------------------------------------------------------------------
  // Native Mapbox feature handlers
  // -------------------------------------------------------------------------

  private handleSetProjection(args: unknown[], kwargs: Record<string, unknown>): void {
    if (!this.map) return;
    const projection = (kwargs.projection as string) || (args[0] as string) || "mercator";
    try {
      this.map.setProjection({ type: projection } as any);
    } catch {
      // Ignore
    }
  }

  private handleUpdateGeoJSONSource(args: unknown[], kwargs: Record<string, unknown>): void {
    if (!this.map) return;
    const sourceId = (kwargs.sourceId as string) || (args[0] as string);
    const data = kwargs.data;
    if (!sourceId) return;
    let source = this.map.getSource(sourceId) as MapboxGl.GeoJSONSource;
    if (!source && !sourceId.endsWith("-source")) {
      source = this.map.getSource(sourceId + "-source") as MapboxGl.GeoJSONSource;
    }
    if (source?.setData) source.setData(data as GeoJSON.GeoJSON);
  }

  private handleAddMapImage(args: unknown[], kwargs: Record<string, unknown>): void {
    if (!this.map) return;
    const name = (kwargs.name as string) || (args[0] as string);
    const url = (kwargs.url as string) || (args[1] as string);
    if (!name || !url) return;
    this.map.loadImage(url, (err, image) => {
      if (err) {
        console.warn("Failed to load image:", err);
        return;
      }
      if (image && !this.map!.hasImage(name)) {
        this.map!.addImage(name, image);
      }
    });
  }

  private handleAddTooltip(args: unknown[], kwargs: Record<string, unknown>): void {
    if (!this.map) return;
    const layerId = kwargs.layerId as string;
    const template = (kwargs.template as string) || "";
    const properties = kwargs.properties as string[] | undefined;
    if (!layerId) return;

    if (this.tooltipLayerHandlers.has(layerId)) {
      const old = this.tooltipLayerHandlers.get(layerId)!;
      this.map.off("mousemove", layerId, old);
      this.tooltipLayerHandlers.delete(layerId);
    }

    const popup = new this.mapboxgl.Popup({ closeButton: false, closeOnClick: false });
    const handler = (e: MapboxGl.MapMouseEvent & { features?: GeoJSON.Feature[] }) => {
      if (!e.features?.length) {
        popup.remove();
        return;
      }
      const props = e.features[0].properties || {};
      let html = template
        ? template.replace(/\{(\w+)\}/g, (_, k: string) => (props[k] !== undefined ? String(props[k]) : ""))
        : Object.entries(props).map(([k, v]) => `<b>${k}:</b> ${v}`).join("<br>");
      popup.setLngLat(e.lngLat).setHTML(`<div style="font-size:12px">${html}</div>`).addTo(this.map!);
    };
    this.map.on("mousemove", layerId, handler as any);
    this.map.on("mouseleave", layerId, () => popup.remove());
    this.tooltipLayerHandlers.set(layerId, handler);
  }

  private handleRemoveTooltip(args: unknown[], kwargs: Record<string, unknown>): void {
    const layerId = kwargs.layerId as string;
    if (layerId && this.tooltipLayerHandlers.has(layerId)) {
      const handler = this.tooltipLayerHandlers.get(layerId)!;
      this.map?.off("mousemove", layerId, handler);
      this.tooltipLayerHandlers.delete(layerId);
    }
  }

  private handleAddCoordinatesControl(args: unknown[], kwargs: Record<string, unknown>): void {
    if (!this.map) return;
    const position = (kwargs.position as string) || "bottom-left";
    if (this.coordinatesControl) {
      this.coordinatesControl.remove();
      if (this.coordinatesHandler) this.map.off("mousemove", this.coordinatesHandler);
    }
    const div = document.createElement("div");
    div.className = "mapboxgl-ctrl mapboxgl-ctrl-group anymap-coordinates";
    div.style.cssText = "padding:4px 8px;font-size:11px;font-family:monospace;background:rgba(255,255,255,0.9);";
    div.textContent = "Lng: 0.0000, Lat: 0.0000";
    const precision = (kwargs.precision as number) ?? 4;
    const handler = (e: MapboxGl.MapMouseEvent) => {
      div.textContent = `Lng: ${e.lngLat.lng.toFixed(precision)}, Lat: ${e.lngLat.lat.toFixed(precision)}`;
    };
    this.map.on("mousemove", handler);
    this.coordinatesHandler = handler;
    this.map.getContainer().querySelector(`.mapboxgl-ctrl-${position}`)?.appendChild(div);
    this.coordinatesControl = div;
  }

  private handleRemoveCoordinatesControl(args: unknown[], kwargs: Record<string, unknown>): void {
    if (this.coordinatesControl) {
      this.coordinatesControl.remove();
      this.coordinatesControl = null;
    }
    if (this.coordinatesHandler) {
      this.map?.off("mousemove", this.coordinatesHandler);
      this.coordinatesHandler = null;
    }
  }

  private handleAddTimeSlider(args: unknown[], kwargs: Record<string, unknown>): void {
    if (!this.map) return;
    const layerId = kwargs.layerId as string;
    const property = kwargs.property as string;
    const min = (kwargs.min as number) ?? 0;
    const max = (kwargs.max as number) ?? 100;
    const step = (kwargs.step as number) ?? 1;
    const position = (kwargs.position as string) || "bottom-left";

    this.handleRemoveTimeSlider([], {});

    const container = document.createElement("div");
    container.className = "mapboxgl-ctrl anymap-time-slider";
    container.style.cssText = "padding:10px;background:rgba(255,255,255,0.95);min-width:250px;";

    const label = document.createElement("div");
    label.textContent = `${kwargs.label || "Time"}: ${min}`;

    const slider = document.createElement("input");
    slider.type = "range";
    slider.min = String(min);
    slider.max = String(max);
    slider.value = String(min);
    slider.addEventListener("input", () => {
      const val = Number(slider.value);
      label.textContent = `${kwargs.label || "Time"}: ${val}`;
      if (layerId && property) this.map?.setFilter(layerId, ["<=", property, val]);
    });

    container.appendChild(label);
    container.appendChild(slider);
    this.map.getContainer().querySelector(`.mapboxgl-ctrl-${position}`)?.appendChild(container);
    this.timeSliderContainer = container;
  }

  private handleRemoveTimeSlider(args: unknown[], kwargs: Record<string, unknown>): void {
    if (this.timeSliderContainer) {
      this.timeSliderContainer.remove();
      this.timeSliderContainer = null;
    }
  }

  private handleAddSwipeMap(args: unknown[], kwargs: Record<string, unknown>): void {
    if (!this.map) return;
    const leftLayer = kwargs.leftLayer as string;
    const rightLayer = kwargs.rightLayer as string;
    if (!leftLayer || !rightLayer) return;
    this.handleRemoveSwipeMap([], {});

    const container = this.map.getContainer();
    const slider = document.createElement("div");
    slider.style.cssText = "position:absolute;top:0;bottom:0;width:4px;background:#fff;cursor:ew-resize;z-index:10;left:50%;";
    container.appendChild(slider);
    this.swipeContainer = slider;
  }

  private handleRemoveSwipeMap(args: unknown[], kwargs: Record<string, unknown>): void {
    if (this.swipeContainer) {
      this.swipeContainer.remove();
      this.swipeContainer = null;
    }
  }

  private handleAddOpacitySlider(args: unknown[], kwargs: Record<string, unknown>): void {
    if (!this.map) return;
    const layerId = kwargs.layerId as string;
    const position = (kwargs.position as string) || "top-right";
    if (!layerId) return;

    const container = document.createElement("div");
    container.className = "mapboxgl-ctrl anymap-opacity-slider";
    container.style.cssText = "padding:8px;background:rgba(255,255,255,0.95);min-width:150px;";

    const label = document.createElement("div");
    label.textContent = `${kwargs.label || layerId}: 100%`;

    const slider = document.createElement("input");
    slider.type = "range";
    slider.min = "0";
    slider.max = "100";
    slider.value = "100";
    slider.addEventListener("input", () => {
      const opacity = Number(slider.value) / 100;
      label.textContent = `${kwargs.label || layerId}: ${slider.value}%`;
      if (this.map?.getLayer(layerId)) {
        const layer = this.map.getLayer(layerId);
        const type = (layer as { type?: string })?.type;
        const prop = type === "raster" ? "raster-opacity" : type === "fill" ? "fill-opacity" : type === "line" ? "line-opacity" : type === "circle" ? "circle-opacity" : null;
        if (prop) this.map.setPaintProperty(layerId, prop, opacity);
      }
    });

    container.appendChild(label);
    container.appendChild(slider);
    this.map.getContainer().querySelector(`.mapboxgl-ctrl-${position}`)?.appendChild(container);
    this.opacitySliderContainer.set(layerId, container);
  }

  private handleRemoveOpacitySlider(args: unknown[], kwargs: Record<string, unknown>): void {
    const layerId = kwargs.layerId as string;
    const el = this.opacitySliderContainer.get(layerId);
    if (el) {
      el.remove();
      this.opacitySliderContainer.delete(layerId);
    }
  }

  private handleAddStyleSwitcher(args: unknown[], kwargs: Record<string, unknown>): void {
    if (!this.map) return;
    const styles = kwargs.styles as Record<string, string>;
    const position = (kwargs.position as string) || "top-right";
    if (!styles || !Object.keys(styles).length) return;
    this.handleRemoveStyleSwitcher([], {});

    const container = document.createElement("div");
    container.className = "mapboxgl-ctrl anymap-style-switcher";
    const select = document.createElement("select");
    for (const [name, url] of Object.entries(styles)) {
      const opt = document.createElement("option");
      opt.value = url;
      opt.textContent = name;
      select.appendChild(opt);
    }
    select.addEventListener("change", () => this.map!.setStyle(select.value));
    container.appendChild(select);
    this.map.getContainer().querySelector(`.mapboxgl-ctrl-${position}`)?.appendChild(container);
    this.styleSwitcherContainer = container;
  }

  private handleRemoveStyleSwitcher(args: unknown[], kwargs: Record<string, unknown>): void {
    if (this.styleSwitcherContainer) {
      this.styleSwitcherContainer.remove();
      this.styleSwitcherContainer = null;
    }
  }

  private handleGetVisibleFeatures(args: unknown[], kwargs: Record<string, unknown>): void {
    if (!this.map) return;
    const layers = kwargs.layers as string[] | undefined;
    const canvas = this.map.getCanvas();
    const bbox: [MapboxGl.PointLike, MapboxGl.PointLike] = canvas
      ? [[0, 0], [canvas.width, canvas.height]]
      : [[0, 0], [256, 256]];
    const features = layers
      ? this.map.queryRenderedFeatures(bbox, { layers })
      : this.map.queryRenderedFeatures(bbox);
    const geojson: FeatureCollection = {
      type: "FeatureCollection",
      features: features.map((f) => ({ type: "Feature" as const, geometry: f.geometry, properties: f.properties })),
    };
    this.model.set("_queried_features", { type: "visible_features", data: geojson });
    this.model.save_changes();
  }

  private handleGetLayerData(args: unknown[], kwargs: Record<string, unknown>): void {
    if (!this.map) return;
    const sourceId = kwargs.sourceId as string;
    if (!sourceId) return;
    let features: GeoJSON.Feature[] = [];
    try {
      features = this.map.querySourceFeatures(sourceId);
    } catch {
      try {
        features = this.map.querySourceFeatures(sourceId + "-source");
      } catch {
        // ignore
      }
    }
    const geojson: FeatureCollection = {
      type: "FeatureCollection",
      features: features.map((f) => ({ type: "Feature" as const, geometry: f.geometry, properties: f.properties, id: f.id })),
    };
    this.model.set("_queried_features", { type: "layer_data", sourceId, data: geojson });
    this.model.save_changes();
  }

  // -------------------------------------------------------------------------
  // LiDAR layer handlers (maplibre-gl-lidar)
  // -------------------------------------------------------------------------

  private async handleAddLidarControl(args: unknown[], kwargs: Record<string, unknown>): Promise<void> {
    if (!this.map) return;

    if (this.lidarControl) {
      console.warn("LiDAR control already exists");
      return;
    }

    const { LidarControl } = await loadMapboxLidar();

    const options = {
      position: (kwargs.position as string) || "top-right",
      collapsed: kwargs.collapsed !== false,
      title: (kwargs.title as string) || "LiDAR Viewer",
      panelWidth: (kwargs.panelWidth as number) || 365,
      panelMaxHeight: (kwargs.panelMaxHeight as number) || 600,
      pointSize: (kwargs.pointSize as number) || 2,
      opacity: (kwargs.opacity as number) || 1.0,
      colorScheme: (kwargs.colorScheme as string) || "elevation",
      usePercentile: kwargs.usePercentile !== false,
      pointBudget: (kwargs.pointBudget as number) || 1000000,
      pickable: kwargs.pickable === true,
      autoZoom: kwargs.autoZoom !== false,
      copcLoadingMode: kwargs.copcLoadingMode as "full" | "dynamic" | undefined,
      streamingPointBudget: (kwargs.streamingPointBudget as number) || 5000000,
    };

    this.lidarControl = new LidarControl(options as LidarControlOptions);
    this.map.addControl(this.lidarControl as unknown as MapboxGl.IControl, options.position as ControlPosition);

    this.lidarControl.on("load", (event: any) => {
      const info = event.pointCloud as { id: string; name: string; pointCount: number; source?: string } | undefined;
      if (info && "name" in info) {
        this.lidarLayers.set(info.id, info.source || "");
        this.sendEvent("lidar:load", { id: info.id, name: info.name, pointCount: info.pointCount });
      }
    });

    this.lidarControl.on("unload", (event: any) => {
      const pointCloud = event.pointCloud as { id: string } | undefined;
      if (pointCloud) {
        this.lidarLayers.delete(pointCloud.id);
        this.sendEvent("lidar:unload", { id: pointCloud.id });
      }
    });
  }

  private async handleAddLidarLayer(args: unknown[], kwargs: Record<string, unknown>): Promise<void> {
    if (!this.map) return;

    const source = kwargs.source as string;
    const name = (kwargs.name as string) || `lidar-${Date.now()}`;
    const isBase64 = kwargs.isBase64 === true;

    if (!source) {
      console.error("LiDAR layer requires a source URL or base64 data");
      return;
    }

    const { LidarControl } = await loadMapboxLidar();

    if (!this.lidarControl) {
      this.lidarControl = new LidarControl({
        collapsed: true,
        position: "top-right",
        pointSize: (kwargs.pointSize as number) || 2,
        opacity: (kwargs.opacity as number) || 1.0,
        colorScheme: (kwargs.colorScheme as string) || "elevation",
        usePercentile: kwargs.usePercentile !== false,
        pointBudget: (kwargs.pointBudget as number) || 1000000,
        pickable: kwargs.pickable !== false,
        autoZoom: kwargs.autoZoom !== false,
      } as LidarControlOptions);

      this.map.addControl(this.lidarControl as unknown as MapboxGl.IControl, "top-right");

      this.lidarControl.on("load", (event: any) => {
        const info = event.pointCloud as { id: string; name: string; pointCount: number; source?: string } | undefined;
        if (info && "name" in info) {
          this.lidarLayers.set(info.id, info.source || "");
          this.sendEvent("lidar:load", { id: info.id, name: info.name, pointCount: info.pointCount });
        }
      });

      this.lidarControl.on("unload", (event: any) => {
        const pointCloud = event.pointCloud as { id: string } | undefined;
        if (pointCloud) {
          this.lidarLayers.delete(pointCloud.id);
          this.sendEvent("lidar:unload", { id: pointCloud.id });
        }
      });
    }

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

    const loadOptions = { id: name, name: (kwargs.filename as string) || name };

    if (isBase64) {
      const binaryString = atob(source);
      const bytes = new Uint8Array(binaryString.length);
      for (let i = 0; i < binaryString.length; i++) bytes[i] = binaryString.charCodeAt(i);
      const arrayBuffer = bytes.buffer;
      const streamingMode = kwargs.streamingMode !== false;
      if (streamingMode) {
        this.lidarControl.loadPointCloudStreaming(arrayBuffer, loadOptions as any);
      } else {
        this.lidarControl.loadPointCloud(arrayBuffer, loadOptions as any);
      }
    } else {
      const streamingMode = kwargs.streamingMode !== false;
      if (streamingMode) {
        this.lidarControl.loadPointCloudStreaming(source, loadOptions as any);
      } else {
        this.lidarControl.loadPointCloud(source, loadOptions as any);
      }
    }

    this.lidarLayers.set(name, source);
  }

  private handleRemoveLidarLayer(args: unknown[], kwargs: Record<string, unknown>): void {
    if (!this.lidarControl) return;
    const id = kwargs.id as string;
    if (id) {
      this.lidarControl.unloadPointCloud(id);
      this.lidarLayers.delete(id);
    } else {
      this.lidarControl.unloadPointCloud();
      this.lidarLayers.clear();
    }
  }

  private handleSetLidarColorScheme(args: unknown[], kwargs: Record<string, unknown>): void {
    if (!this.lidarControl) return;
    const colorScheme = kwargs.colorScheme as string;
    if (colorScheme) {
      this.lidarControl.setColorScheme(colorScheme as LidarColorScheme);
    }
  }

  private handleSetLidarPointSize(args: unknown[], kwargs: Record<string, unknown>): void {
    if (!this.lidarControl) return;
    const pointSize = kwargs.pointSize as number;
    if (pointSize !== undefined) {
      this.lidarControl.setPointSize(pointSize);
    }
  }

  private handleSetLidarOpacity(args: unknown[], kwargs: Record<string, unknown>): void {
    if (!this.lidarControl) return;
    const opacity = kwargs.opacity as number;
    if (opacity !== undefined) {
      this.lidarControl.setOpacity(opacity);
    }
  }


  // -------------------------------------------------------------------------
  // PMTiles, maplibre-gl-components, clustering, choropleth, 3D buildings
  // -------------------------------------------------------------------------

  private handleAddPMTilesLayer(args: unknown[], kwargs: Record<string, unknown>): void {
    if (!this.map) return;
    const url = kwargs.url as string;
    const layerId = (kwargs.id as string) || `pmtiles-${Date.now()}`;
    const sourceType = (kwargs.sourceType as string) || "vector";
    const opacity = (kwargs.opacity as number) ?? 1;
    const pmtilesUrl = url.startsWith("pmtiles://") ? url : `pmtiles://${url}`;
    const sourceId = `${layerId}-source`;

    if (!this.map.getSource(sourceId)) {
      this.map.addSource(sourceId, { type: sourceType as "vector" | "raster", url: pmtilesUrl });
    }
    if (!this.map.getLayer(layerId)) {
      const layerConfig: Record<string, unknown> = {
        id: layerId,
        type: sourceType === "vector" ? "fill" : "raster",
        source: sourceId,
        paint: sourceType === "vector" ? { "fill-color": "#3388ff", "fill-opacity": opacity } : { "raster-opacity": opacity },
      };
      this.map.addLayer(layerConfig as any);
    }
  }

  private handleRemovePMTilesLayer(args: unknown[], kwargs: Record<string, unknown>): void {
    const [layerId] = args as [string];
    const sourceId = `${layerId}-source`;
    if (this.map?.getLayer(layerId)) this.map.removeLayer(layerId);
    if (this.map?.getSource(sourceId)) this.map.removeSource(sourceId);
  }

  private async handleAddPMTilesControl(args: unknown[], kwargs: Record<string, unknown>): Promise<void> {
    if (!this.map) return;
    const position = (kwargs.position as ControlPosition) || "top-right";
    const { PMTilesLayerControl } = await loadMapboxComponents();
    this.pmtilesLayerControl = new PMTilesLayerControl({ collapsed: kwargs.collapsed !== false } as any);
    this.map.addControl(this.pmtilesLayerControl as unknown as MapboxGl.IControl, position);
    this.controlsMap.set("pmtiles-control", this.pmtilesLayerControl as unknown as MapboxGl.IControl);
  }

  private async handleAddCogControl(args: unknown[], kwargs: Record<string, unknown>): Promise<void> {
    if (!this.map) return;
    const position = (kwargs.position as ControlPosition) || "top-right";
    const { CogLayerControl } = await loadMapboxComponents();
    this.cogLayerUiControl = new CogLayerControl({ collapsed: kwargs.collapsed !== false } as any);
    this.map.addControl(this.cogLayerUiControl as unknown as MapboxGl.IControl, position);
    this.controlsMap.set("cog-control", this.cogLayerUiControl as unknown as MapboxGl.IControl);
  }

  private async handleAddZarrControl(args: unknown[], kwargs: Record<string, unknown>): Promise<void> {
    if (!this.map) return;
    const position = (kwargs.position as ControlPosition) || "top-right";
    const { ZarrLayerControl } = await loadMapboxComponents();
    this.zarrLayerUiControl = new ZarrLayerControl({ collapsed: kwargs.collapsed !== false } as any);
    this.map.addControl(this.zarrLayerUiControl as unknown as MapboxGl.IControl, position);
    this.controlsMap.set("zarr-control", this.zarrLayerUiControl as unknown as MapboxGl.IControl);
  }

  private async handleAddVectorControl(args: unknown[], kwargs: Record<string, unknown>): Promise<void> {
    if (!this.map) return;
    const position = (kwargs.position as ControlPosition) || "top-right";
    const { AddVectorControl } = await loadMapboxComponents();
    this.addVectorControl = new AddVectorControl({ collapsed: kwargs.collapsed !== false } as any);
    this.map.addControl(this.addVectorControl as unknown as MapboxGl.IControl, position);
    this.controlsMap.set("vector-control", this.addVectorControl as unknown as MapboxGl.IControl);
  }

  private async handleAddControlGrid(args: unknown[], kwargs: Record<string, unknown>): Promise<void> {
    if (!this.map) return;
    const position = (kwargs.position as string) || "top-right";
    const { addControlGrid } = await loadMapboxComponents();
    this.controlGrid = addControlGrid(this.map as any, { position } as any);
    this.controlsMap.set("control-grid", this.controlGrid as unknown as MapboxGl.IControl);
  }

  private handleAddClusterLayer(args: unknown[], kwargs: Record<string, unknown>): void {
    if (!this.map) return;
    const geojson = kwargs.data as GeoJSON.FeatureCollection;
    const name = (kwargs.name as string) || `cluster-${Date.now()}`;
    const sourceId = `${name}-source`;

    if (!this.map.getSource(sourceId)) {
      this.map.addSource(sourceId, {
        type: "geojson",
        data: geojson,
        cluster: true,
        clusterMaxZoom: (kwargs.clusterMaxZoom as number) || 14,
        clusterRadius: (kwargs.clusterRadius as number) || 50,
      });
    }
    const clusterLayerId = `${name}-clusters`;
    if (!this.map.getLayer(clusterLayerId)) {
      this.map.addLayer({
        id: clusterLayerId,
        type: "circle",
        source: sourceId,
        filter: ["has", "point_count"],
        paint: {
          "circle-color": ["step", ["get", "point_count"], "#51bbd6", 100, "#f1f075", 750, "#f28cb1"],
          "circle-radius": ["step", ["get", "point_count"], 15, 100, 20, 750, 25],
        },
      });
    }
    const unclusteredId = `${name}-unclustered`;
    if (!this.map.getLayer(unclusteredId)) {
      this.map.addLayer({
        id: unclusteredId,
        type: "circle",
        source: sourceId,
        filter: ["!", ["has", "point_count"]],
        paint: {
          "circle-color": (kwargs.unclusteredColor as string) || "#11b4da",
          "circle-radius": (kwargs.unclusteredRadius as number) || 8,
        },
      });
    }
  }

  private handleRemoveClusterLayer(args: unknown[], kwargs: Record<string, unknown>): void {
    const [layerId] = args as [string];
    const sourceId = `${layerId}-source`;
    for (const id of [`${layerId}-clusters`, `${layerId}-cluster-count`, `${layerId}-unclustered`]) {
      if (this.map?.getLayer(id)) this.map.removeLayer(id);
    }
    if (this.map?.getSource(sourceId)) this.map.removeSource(sourceId);
  }

  private handleAddChoropleth(args: unknown[], kwargs: Record<string, unknown>): void {
    if (!this.map) return;
    const geojson = kwargs.data as GeoJSON.FeatureCollection;
    const name = (kwargs.name as string) || `choropleth-${Date.now()}`;
    const sourceId = `${name}-source`;
    const stepExpression = kwargs.stepExpression as unknown[];

    if (!this.map.getSource(sourceId)) {
      this.map.addSource(sourceId, { type: "geojson", data: geojson, generateId: true });
    }
    if (!this.map.getLayer(name)) {
      this.map.addLayer({
        id: name,
        type: "fill",
        source: sourceId,
        paint: {
          "fill-color": (stepExpression as any) || "#3388ff",
          "fill-opacity": (kwargs.fillOpacity as number) ?? 0.7,
        },
      } as any);
    }
  }

  private handleAdd3DBuildings(args: unknown[], kwargs: Record<string, unknown>): void {
    if (!this.map) return;
    const layerId = (kwargs.layerId as string) || "3d-buildings";
    const style = this.map.getStyle();
    let sourceId: string | null = null;
    for (const [id, src] of Object.entries(style.sources || {})) {
      if ((src as { type?: string }).type === "vector") {
        sourceId = id;
        break;
      }
    }
    if (!sourceId) {
      sourceId = "buildings-source";
      if (!this.map.getSource(sourceId)) {
        this.map.addSource(sourceId, { type: "vector", url: "https://tiles.openfreemap.org/planet" });
      }
    }
    if (!this.map.getLayer(layerId)) {
      this.map.addLayer({
        id: layerId,
        source: sourceId,
        "source-layer": "building",
        type: "fill-extrusion",
        minzoom: (kwargs.minZoom as number) ?? 14,
        paint: {
          "fill-extrusion-color": (kwargs.fillExtrusionColor as string) || "#aaa",
          "fill-extrusion-height": ["coalesce", ["get", "render_height"], ["get", "height"], 10],
          "fill-extrusion-base": ["coalesce", ["get", "render_min_height"], 0],
          "fill-extrusion-opacity": (kwargs.fillExtrusionOpacity as number) ?? 0.6,
        },
      } as any);
    }
  }

  // -------------------------------------------------------------------------
  // Route Animation
  // -------------------------------------------------------------------------

  private async handleAnimateAlongRoute(args: unknown[], kwargs: Record<string, unknown>): Promise<void> {
    if (!this.map) return;
    const id = kwargs.id as string;
    const coordinates = kwargs.coordinates as [number, number][];
    const duration = (kwargs.duration as number) || 10000;
    const loop = kwargs.loop !== false;
    const showTrail = kwargs.showTrail === true;

    const turf = await loadTurf();
    const line = turf.lineString(coordinates);
    const routeLength = turf.length(line, { units: "kilometers" });
    const marker = new this.mapboxgl.Marker({ color: (kwargs.markerColor as string) || "#3388ff" })
      .setLngLat(coordinates[0])
      .addTo(this.map);

    let trailSourceId: string | undefined;
    let trailLayerId: string | undefined;
    if (showTrail) {
      trailSourceId = `${id}-trail-source`;
      trailLayerId = `${id}-trail`;
      this.map.addSource(trailSourceId, {
        type: "geojson",
        data: { type: "Feature", properties: {}, geometry: { type: "LineString", coordinates: [] } },
      });
      this.map.addLayer({
        id: trailLayerId,
        type: "line",
        source: trailSourceId,
        paint: { "line-color": "#3388ff", "line-width": 3 },
      });
    }

    const startTime = performance.now();
    const trailCoords: [number, number][] = [coordinates[0]];

    const animate = (currentTime: number) => {
      const anim = this.animations.get(id);
      if (!anim || !this.map) return;
      if (anim.isPaused) {
        anim.animationId = requestAnimationFrame(animate);
        return;
      }
      const elapsed = (currentTime - anim.startTime) * anim.speed;
      const progress = (elapsed % anim.duration) / anim.duration;
      const distance = progress * routeLength;
      const point = turf.along(line, distance, { units: "kilometers" });
      const pos = point.geometry.coordinates as [number, number];
      anim.marker.setLngLat(pos);
      if (showTrail && trailSourceId) {
        trailCoords.push(pos);
        (this.map.getSource(trailSourceId) as MapboxGl.GeoJSONSource)?.setData({
          type: "Feature",
          properties: {},
          geometry: { type: "LineString", coordinates: trailCoords },
        });
      }
      if (elapsed >= anim.duration && !loop) {
        this.handleStopAnimation([id], {});
        return;
      }
      anim.animationId = requestAnimationFrame(animate);
    };

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
    const anim = this.animations.get(id);
    if (!anim) return;
    cancelAnimationFrame(anim.animationId);
    anim.marker.remove();
    if (anim.trailLayerId && this.map?.getLayer(anim.trailLayerId)) this.map.removeLayer(anim.trailLayerId);
    if (anim.trailSourceId && this.map?.getSource(anim.trailSourceId)) this.map.removeSource(anim.trailSourceId);
    this.animations.delete(id);
  }

  private handlePauseAnimation(args: unknown[], kwargs: Record<string, unknown>): void {
    const [id] = args as [string];
    const anim = this.animations.get(id);
    if (anim) {
      anim.isPaused = true;
      anim.pausedAt = performance.now();
    }
  }

  private handleResumeAnimation(args: unknown[], kwargs: Record<string, unknown>): void {
    const [id] = args as [string];
    const anim = this.animations.get(id);
    if (anim?.isPaused) {
      anim.startTime += performance.now() - anim.pausedAt;
      anim.isPaused = false;
      anim.pausedAt = 0;
    }
  }

  private handleSetAnimationSpeed(args: unknown[], kwargs: Record<string, unknown>): void {
    const [id, speed] = args as [string, number];
    const anim = this.animations.get(id);
    if (anim) anim.speed = speed;
  }

  // -------------------------------------------------------------------------
  // Feature Hover, Fog, Filter, Query
  // -------------------------------------------------------------------------

  private handleAddHoverEffect(args: unknown[], kwargs: Record<string, unknown>): void {
    if (!this.map) return;
    const layerId = kwargs.layerId as string;
    const layer = this.map.getLayer(layerId);
    if (!layer) return;
    const sourceId = (layer as { source?: string }).source;
    if (!sourceId) return;

    this.map.on("mousemove", layerId, (e: any) => {
      if (!this.map || !e.features?.length) return;
      if (this.hoveredFeatureId !== null) {
        this.map.setFeatureState({ source: sourceId, id: this.hoveredFeatureId }, { hover: false });
      }
      const f = e.features[0];
      this.hoveredFeatureId = (f as GeoJSON.Feature).id ?? null;
      this.hoveredLayerId = layerId;
      if (this.hoveredFeatureId !== null) {
        this.map.setFeatureState({ source: sourceId, id: this.hoveredFeatureId }, { hover: true });
      }
      this.map.getCanvas().style.cursor = "pointer";
    });
    this.map.on("mouseleave", layerId, () => {
      if (this.map && this.hoveredFeatureId !== null) {
        this.map.setFeatureState({ source: sourceId, id: this.hoveredFeatureId }, { hover: false });
      }
      this.hoveredFeatureId = null;
      this.hoveredLayerId = null;
      if (this.map) this.map.getCanvas().style.cursor = "";
    });
  }

  private handleSetFog(args: unknown[], kwargs: Record<string, unknown>): void {
    if (!this.map) return;
    const fog: MapboxGl.FogSpecification = {
      range: (kwargs.range as [number, number]) || [0.5, 10],
      color: (kwargs.color as string) || "white",
      "high-color": (kwargs.highColor as string) || "#245cdf",
      "space-color": (kwargs.spaceColor as string) || "#000000",
    };
    this.map.setFog(fog);
  }

  private handleRemoveFog(args: unknown[], kwargs: Record<string, unknown>): void {
    if (!this.map) return;
    this.map.setFog(null as any);
  }

  private handleSetFilter(args: unknown[], kwargs: Record<string, unknown>): void {
    if (!this.map) return;
    const layerId = kwargs.layerId as string;
    const filter = kwargs.filter as unknown[] | null;
    if (layerId && this.map.getLayer(layerId)) {
      this.map.setFilter(layerId, filter as any);
      this.stateManager.setLayerFilter(layerId, filter);
    }
  }

  private handleQueryRenderedFeatures(args: unknown[], kwargs: Record<string, unknown>): void {
    if (!this.map) return;
    const geometry = kwargs.geometry as MapboxGl.PointLike | [MapboxGl.PointLike, MapboxGl.PointLike] | undefined;
    const layers = kwargs.layers as string[] | undefined;
    const canvas = this.map.getCanvas();
    const bbox: [MapboxGl.PointLike, MapboxGl.PointLike] = canvas
      ? [[0, 0], [canvas.width, canvas.height]]
      : [[0, 0], [256, 256]];
    const features = geometry
      ? this.map.queryRenderedFeatures(geometry, { layers })
      : this.map.queryRenderedFeatures(bbox, { layers });
    this.model.set("_queried_features", {
      type: "FeatureCollection",
      features: features.map((f) => ({ type: "Feature" as const, geometry: f.geometry, properties: f.properties, id: f.id })),
    });
    this.model.save_changes();
  }

  private handleQuerySourceFeatures(args: unknown[], kwargs: Record<string, unknown>): void {
    if (!this.map) return;
    const sourceId = kwargs.sourceId as string;
    if (!sourceId) return;
    const features = this.map.querySourceFeatures(sourceId);
    this.model.set("_queried_features", {
      type: "FeatureCollection",
      features: features.map((f) => ({ type: "Feature" as const, geometry: f.geometry, properties: f.properties, id: f.id })),
    });
    this.model.save_changes();
  }

  // -------------------------------------------------------------------------
  // Video Layer
  // -------------------------------------------------------------------------

  private handleAddVideoLayer(args: unknown[], kwargs: Record<string, unknown>): void {
    if (!this.map) return;
    const id = (kwargs.id as string) || `video-${Date.now()}`;
    const urls = kwargs.urls as string[];
    const coordinates = kwargs.coordinates as number[][];
    if (!urls?.length || !coordinates || coordinates.length !== 4) return;

    const sourceId = `${id}-source`;
    this.map.addSource(sourceId, {
      type: "video",
      urls,
      coordinates: coordinates as [[number, number], [number, number], [number, number], [number, number]],
    });
    this.map.addLayer({
      id,
      type: "raster",
      source: sourceId,
      paint: { "raster-opacity": (kwargs.opacity as number) ?? 1 },
    });
    this.videoSources.set(id, sourceId);
  }

  private handleRemoveVideoLayer(args: unknown[], kwargs: Record<string, unknown>): void {
    const id = kwargs.id as string;
    if (!id) return;
    const sourceId = this.videoSources.get(id) || `${id}-source`;
    if (this.map?.getLayer(id)) this.map.removeLayer(id);
    if (this.map?.getSource(sourceId)) this.map.removeSource(sourceId);
    this.videoSources.delete(id);
  }

  private handlePlayVideo(args: unknown[], kwargs: Record<string, unknown>): void {
    const id = kwargs.id as string;
    const sourceId = this.videoSources.get(id) || `${id}-source`;
    const source = this.map?.getSource(sourceId) as { play?: () => void };
    if (source?.play) source.play();
  }

  private handlePauseVideo(args: unknown[], kwargs: Record<string, unknown>): void {
    const id = kwargs.id as string;
    const sourceId = this.videoSources.get(id) || `${id}-source`;
    const source = this.map?.getSource(sourceId) as { pause?: () => void };
    if (source?.pause) source.pause();
  }

  private handleSeekVideo(args: unknown[], kwargs: Record<string, unknown>): void {
    const id = kwargs.id as string;
    const time = kwargs.time as number;
    const sourceId = this.videoSources.get(id) || `${id}-source`;
    const source = this.map?.getSource(sourceId) as { getVideo?: () => HTMLVideoElement };
    const video = source?.getVideo?.();
    if (video) video.currentTime = time;
  }

  // -------------------------------------------------------------------------
  // Split Map
  // -------------------------------------------------------------------------

  private handleAddSplitMap(args: unknown[], kwargs: Record<string, unknown>): void {
    if (!this.map || !this.mapContainer) return;
    const leftLayer = kwargs.leftLayer as string;
    const rightLayer = kwargs.rightLayer as string;
    if (!leftLayer || !rightLayer) return;
    if (this.splitActive) this.handleRemoveSplitMap([], {});

    this.splitActive = true;
    if (this.map.getLayer(rightLayer)) {
      this.map.setLayoutProperty(rightLayer, "visibility", "none");
    }

    const rightContainer = document.createElement("div");
    rightContainer.style.cssText = "position:absolute;top:0;left:0;width:100%;height:100%;clip-path:inset(0 0 0 50%);pointer-events:none;";
    this.mapContainer.appendChild(rightContainer);
    this.splitMapContainer = rightContainer;

    const style = this.model.get("style");
    this.splitMapRight = new this.mapboxgl.Map({
      container: rightContainer,
      style: typeof style === "string" ? style : (style as any),
      center: this.map.getCenter(),
      zoom: this.map.getZoom(),
      bearing: this.map.getBearing(),
      pitch: this.map.getPitch(),
      interactive: false,
      attributionControl: false,
    });

    const syncMaps = () => {
      if (this.map && this.splitMapRight) {
        this.splitMapRight.jumpTo({
          center: this.map.getCenter(),
          zoom: this.map.getZoom(),
          bearing: this.map.getBearing(),
          pitch: this.map.getPitch(),
        });
      }
    };
    this.map.on("move", syncMaps);

    const slider = document.createElement("div");
    slider.style.cssText = "position:absolute;top:0;left:50%;width:4px;height:100%;background:#333;cursor:ew-resize;z-index:10;";
    this.mapContainer.appendChild(slider);
    this.splitSlider = slider;

    let isDragging = false;
    const onPointerDown = () => { isDragging = true; };
    const onPointerMove = (e: PointerEvent) => {
      if (!isDragging || !this.mapContainer || !this.splitMapContainer) return;
      const rect = this.mapContainer.getBoundingClientRect();
      const pct = Math.max(0, Math.min(100, ((e.clientX - rect.left) / rect.width) * 100));
      slider.style.left = `${pct}%`;
      this.splitMapContainer.style.clipPath = `inset(0 0 0 ${pct}%)`;
    };
    const onPointerUp = () => { isDragging = false; };
    slider.addEventListener("pointerdown", onPointerDown);
    window.addEventListener("pointermove", onPointerMove);
    window.addEventListener("pointerup", onPointerUp);
    (slider as any)._cleanup = () => {
      slider.removeEventListener("pointerdown", onPointerDown);
      window.removeEventListener("pointermove", onPointerMove);
      window.removeEventListener("pointerup", onPointerUp);
      this.map?.off("move", syncMaps);
    };
  }

  private handleRemoveSplitMap(args: unknown[], kwargs: Record<string, unknown>): void {
    if (!this.splitActive) return;
    if (this.splitSlider) {
      (this.splitSlider as any)?._cleanup?.();
      this.splitSlider.remove();
      this.splitSlider = null;
    }
    if (this.splitMapRight) {
      this.splitMapRight.remove();
      this.splitMapRight = null;
    }
    if (this.splitMapContainer) {
      this.splitMapContainer.remove();
      this.splitMapContainer = null;
    }
    this.splitActive = false;
  }


  // -------------------------------------------------------------------------
  // Colorbar, Search, Measure, Print
  // -------------------------------------------------------------------------

  private async handleAddColorbar(args: unknown[], kwargs: Record<string, unknown>): Promise<void> {
    if (!this.map) return;
    const colorbarId = (kwargs.colorbarId as string) || `colorbar-${Date.now()}`;
    const position = (kwargs.position as ControlPosition) || "bottom-right";
    const { Colorbar } = await loadMapboxComponents();
    const colorbar = new Colorbar({
      colormap: kwargs.colormap as string[],
      vmin: kwargs.vmin as number,
      vmax: kwargs.vmax as number,
      label: kwargs.label as string,
    } as any);
    this.map.addControl(colorbar as unknown as MapboxGl.IControl, position);
    this.colorbarsMap.set(colorbarId, colorbar);
    this.controlsMap.set(colorbarId, colorbar as unknown as MapboxGl.IControl);
  }

  private handleRemoveColorbar(args: unknown[], kwargs: Record<string, unknown>): void {
    const colorbarId = (kwargs.colorbarId as string) || (args[0] as string);
    if (colorbarId) {
      const cb = this.colorbarsMap.get(colorbarId);
      if (cb && this.map) {
        this.map.removeControl(cb as unknown as MapboxGl.IControl);
        this.colorbarsMap.delete(colorbarId);
        this.controlsMap.delete(colorbarId);
      }
    } else {
      this.colorbarsMap.forEach((cb) => {
        if (this.map) this.map.removeControl(cb as unknown as MapboxGl.IControl);
      });
      this.colorbarsMap.clear();
    }
  }

  private handleUpdateColorbar(args: unknown[], kwargs: Record<string, unknown>): void {
    const colorbarId = (kwargs.colorbarId as string) || "colorbar-0";
    const colorbar = this.colorbarsMap.get(colorbarId);
    if (colorbar?.update) colorbar.update(kwargs as any);
  }

  private async handleAddSearchControl(args: unknown[], kwargs: Record<string, unknown>): Promise<void> {
    if (!this.map) return;
    const position = (kwargs.position as ControlPosition) || "top-left";
    if (this.searchControl) {
      this.map.removeControl(this.searchControl as unknown as MapboxGl.IControl);
      this.controlsMap.delete("search-control");
    }
    const { SearchControl } = await loadMapboxComponents();
    this.searchControl = new SearchControl(kwargs as any);
    this.map.addControl(this.searchControl as unknown as MapboxGl.IControl, position);
    this.controlsMap.set("search-control", this.searchControl as unknown as MapboxGl.IControl);
  }

  private handleRemoveSearchControl(args: unknown[], kwargs: Record<string, unknown>): void {
    if (this.searchControl && this.map) {
      this.map.removeControl(this.searchControl as unknown as MapboxGl.IControl);
      this.controlsMap.delete("search-control");
      this.searchControl = null;
    }
  }

  private async handleAddMeasureControl(args: unknown[], kwargs: Record<string, unknown>): Promise<void> {
    if (!this.map) return;
    const position = (kwargs.position as ControlPosition) || "top-right";
    if (this.measureControl) {
      this.map.removeControl(this.measureControl as unknown as MapboxGl.IControl);
      this.controlsMap.delete("measure-control");
    }
    const { MeasureControl } = await loadMapboxComponents();
    this.measureControl = new MeasureControl(kwargs as any);
    this.map.addControl(this.measureControl as unknown as MapboxGl.IControl, position);
    this.controlsMap.set("measure-control", this.measureControl as unknown as MapboxGl.IControl);
  }

  private handleRemoveMeasureControl(args: unknown[], kwargs: Record<string, unknown>): void {
    if (this.measureControl && this.map) {
      this.map.removeControl(this.measureControl as unknown as MapboxGl.IControl);
      this.controlsMap.delete("measure-control");
      this.measureControl = null;
    }
  }

  private async handleAddPrintControl(args: unknown[], kwargs: Record<string, unknown>): Promise<void> {
    if (!this.map) return;
    const position = (kwargs.position as ControlPosition) || "top-right";
    if (this.printControl) {
      this.map.removeControl(this.printControl as unknown as MapboxGl.IControl);
      this.controlsMap.delete("print-control");
    }
    const { PrintControl } = await loadMapboxComponents();
    this.printControl = new PrintControl(kwargs as any);
    this.map.addControl(this.printControl as unknown as MapboxGl.IControl, position);
    this.controlsMap.set("print-control", this.printControl as unknown as MapboxGl.IControl);
  }

  private handleRemovePrintControl(args: unknown[], kwargs: Record<string, unknown>): void {
    if (this.printControl && this.map) {
      this.map.removeControl(this.printControl as unknown as MapboxGl.IControl);
      this.controlsMap.delete("print-control");
      this.printControl = null;
    }
  }

  // -------------------------------------------------------------------------
  // FlatGeobuf
  // -------------------------------------------------------------------------

  private async handleAddFlatGeobuf(args: unknown[], kwargs: Record<string, unknown>): Promise<void> {
    if (!this.map) return;
    const url = kwargs.url as string;
    const name = (kwargs.name as string) || `flatgeobuf-${Date.now()}`;
    const layerType = kwargs.layerType as string | undefined;
    const paint = kwargs.paint as Record<string, unknown> | undefined;
    const fitBounds = kwargs.fitBounds !== false;

    const sourceId = `${name}-source`;
    const layerId = name;

    try {
      const flatgeobuf = await loadFlatgeobuf();
      const response = await fetch(url);
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const features: Feature[] = [];
      for await (const f of flatgeobuf.deserialize(response.body as ReadableStream)) {
        features.push(f as Feature);
      }
      const fc: FeatureCollection = { type: "FeatureCollection", features };

      let type = layerType;
      if (!type && features.length > 0) type = this.inferLayerType(features[0].geometry!.type);
      type = type || "circle";
      const layerPaint = paint || this.getDefaultPaint(type);

      if (!this.map.getSource(sourceId)) {
        this.map.addSource(sourceId, { type: "geojson", data: fc });
      }
      if (!this.map.getLayer(layerId)) {
        this.map.addLayer({ id: layerId, type: type as any, source: sourceId, paint: layerPaint as any });
      }

      if (fitBounds && features.length > 0) {
        const b = new this.mapboxgl.LngLatBounds();
        for (const f of features) {
          const g = f.geometry!;
          if (g.type === "Point") b.extend(g.coordinates as [number, number]);
          else if (g.type === "LineString" || g.type === "MultiPoint") {
            for (const c of g.coordinates) b.extend(c as [number, number]);
          } else if (g.type === "Polygon" || g.type === "MultiLineString") {
            for (const ring of g.coordinates) {
              for (const c of ring) b.extend(c as [number, number]);
            }
          } else if (g.type === "MultiPolygon") {
            for (const poly of g.coordinates) {
              for (const ring of poly) {
                for (const c of ring) b.extend(c as [number, number]);
              }
            }
          }
        }
        if (!b.isEmpty()) this.map.fitBounds(b, { padding: 50 });
      }
    } catch (err) {
      console.error("Error loading FlatGeobuf:", err);
    }
  }

  private handleRemoveFlatGeobuf(args: unknown[], kwargs: Record<string, unknown>): void {
    const name = (kwargs.name as string) || (args[0] as string);
    if (!name) return;
    const layerId = name;
    const sourceId = `${name}-source`;
    if (this.map?.getLayer(layerId)) this.map.removeLayer(layerId);
    if (this.map?.getSource(sourceId)) this.map.removeSource(sourceId);
  }

  // -------------------------------------------------------------------------
  // Trait change handlers
  // -------------------------------------------------------------------------

  protected onCenterChange(): void {
    if (this.map && this.isMapReady) {
      const center = this.model.get("center");
      this.map.setCenter(center as [number, number]);
    }
  }

  protected onZoomChange(): void {
    if (this.map && this.isMapReady) {
      const zoom = this.model.get("zoom");
      this.map.setZoom(zoom);
    }
  }

  protected onStyleChange(): void {
    if (this.map && this.isMapReady) {
      const style = this.model.get("style");
      this.map.setStyle(typeof style === "string" ? style : (style as any));
    }
  }

  // -------------------------------------------------------------------------
  // Cleanup
  // -------------------------------------------------------------------------

  destroy(): void {
    if (this.splitActive) this.handleRemoveSplitMap([], {});
    this.removeModelListeners();

    if (this.resizeDebounceTimer !== null) {
      window.clearTimeout(this.resizeDebounceTimer);
      this.resizeDebounceTimer = null;
    }
    if (this.resizeObserver) {
      this.resizeObserver.disconnect();
      this.resizeObserver = null;
    }

    if (this.mapboxDraw && this.map) {
      this.map.removeControl(this.mapboxDraw as unknown as MapboxGl.IControl);
      this.mapboxDraw = null;
    }

    for (const [, div] of this.legendsMap) {
      if (div.parentNode) div.parentNode.removeChild(div);
    }
    this.legendsMap.clear();

    if (this.timeSliderContainer) {
      this.timeSliderContainer.remove();
      this.timeSliderContainer = null;
    }
    this.opacitySliderContainer.forEach((el) => el.remove());
    this.opacitySliderContainer.clear();
    if (this.styleSwitcherContainer) {
      this.styleSwitcherContainer.remove();
      this.styleSwitcherContainer = null;
    }
    if (this.swipeContainer) {
      this.swipeContainer.remove();
      this.swipeContainer = null;
    }
    if (this.coordinatesControl) {
      this.coordinatesControl.remove();
      this.coordinatesControl = null;
    }
    if (this.coordinatesHandler) {
      this.map?.off("mousemove", this.coordinatesHandler);
      this.coordinatesHandler = null;
    }

    this.colorbarsMap.forEach((cb) => {
      if (this.map) this.map.removeControl(cb as unknown as MapboxGl.IControl);
    });
    this.colorbarsMap.clear();
    if (this.searchControl && this.map) {
      this.map.removeControl(this.searchControl as unknown as MapboxGl.IControl);
      this.searchControl = null;
    }
    if (this.measureControl && this.map) {
      this.map.removeControl(this.measureControl as unknown as MapboxGl.IControl);
      this.measureControl = null;
    }
    if (this.printControl && this.map) {
      this.map.removeControl(this.printControl as unknown as MapboxGl.IControl);
      this.printControl = null;
    }
    if (this.controlGrid && this.map) {
      this.map.removeControl(this.controlGrid as unknown as MapboxGl.IControl);
      this.controlGrid = null;
    }

    if (this.deckOverlay && this.map) {
      this.map.removeControl(this.deckOverlay as unknown as MapboxGl.IControl);
      this.deckOverlay = null;
    }
    this.deckLayers.clear();

    this.animations.forEach((anim: any, id: string) => {
      cancelAnimationFrame(anim.animationId);
      anim.marker.remove();
      if (anim.trailLayerId && this.map?.getLayer(anim.trailLayerId)) this.map.removeLayer(anim.trailLayerId);
      if (anim.trailSourceId && this.map?.getSource(anim.trailSourceId)) this.map.removeSource(anim.trailSourceId);
    });
    this.animations.clear();

    this.zarrLayers.forEach((_, id) => {
      if (this.map?.getLayer(id)) this.map.removeLayer(id);
    });
    this.zarrLayers.clear();
    this.videoSources.clear();

    if (this.lidarControl && this.map) {
      this.map.removeControl(this.lidarControl as unknown as MapboxGl.IControl);
      this.lidarControl = null;
    }
    this.lidarLayers.clear();

    this.markersMap.forEach((marker) => marker.remove());
    this.markersMap.clear();
    this.popupsMap.forEach((popup) => popup.remove());
    this.popupsMap.clear();

    this.controlsMap.forEach((control) => {
      if (this.map) this.map.removeControl(control);
    });
    this.controlsMap.clear();

    if (this.map) {
      this.map.remove();
      this.map = null;
    }
    if (this.mapContainer) {
      this.mapContainer.remove();
      this.mapContainer = null;
    }
  }
}

