/**
 * DeckGL renderer implementation.
 * Extends MapLibre with deck.gl layer support.
 */

import { MapboxOverlay } from '@deck.gl/mapbox';
import { ScatterplotLayer, ArcLayer, PathLayer, PolygonLayer, IconLayer, TextLayer, PointCloudLayer, GeoJsonLayer, LineLayer } from '@deck.gl/layers';
import { HexagonLayer, HeatmapLayer, GridLayer, ContourLayer, ScreenGridLayer } from '@deck.gl/aggregation-layers';
import { TripsLayer } from '@deck.gl/geo-layers';
import { COGLayer, proj } from '@developmentseed/deck.gl-geotiff';
import { toProj4 } from 'geotiff-geokeys-to-proj4';

import { MapLibreRenderer } from '../maplibre/MapLibreRenderer';
import type { MapWidgetModel } from '../types/anywidget';
import type { DeckGLLayerConfig, COGLayerProps } from '../types/deckgl';

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
 * DeckGL map renderer extending MapLibre.
 */
interface TripsLayerConfig {
  id: string;
  data: unknown[];
  pickable: boolean;
  opacity: number;
  widthMinPixels: number;
  trailLength: number;
  fadeTrail: boolean;
  jointRounded: boolean;
  capRounded: boolean;
  getPath: unknown;
  getTimestamps: unknown;
  getColor: unknown;
}

export class DeckGLRenderer extends MapLibreRenderer {
  private deckOverlay: MapboxOverlay | null = null;
  private deckLayers: Map<string, unknown> = new Map();
  private tripsLayerConfigs: Map<string, TripsLayerConfig> = new Map();
  private tripsAnimations: Map<string, {
    frameId: number;
    lastTime: number;
    speed: number;
    loopLength: number;
    currentTime: number;
  }> = new Map();

  constructor(model: MapWidgetModel, el: HTMLElement) {
    super(model, el);
    this.registerDeckGLMethods();
  }

  /**
   * Initialize with deck.gl overlay.
   */
  async initialize(): Promise<void> {
    await super.initialize();

    // Create deck.gl overlay
    if (this.map) {
      this.deckOverlay = new MapboxOverlay({
        layers: [],
      });
      this.map.addControl(this.deckOverlay as any);
    }
  }

  /**
   * Register DeckGL-specific method handlers.
   */
  private registerDeckGLMethods(): void {
    // DeckGL layers
    this.registerMethod('addScatterplotLayer', this.handleAddScatterplotLayer.bind(this));
    this.registerMethod('addArcLayer', this.handleAddArcLayer.bind(this));
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
    this.registerMethod('addPointCloudLayer', this.handleAddPointCloudLayer.bind(this));
    this.registerMethod('addTripsLayer', this.handleAddTripsLayer.bind(this));
    this.registerMethod('addLineLayer', this.handleAddLineLayer.bind(this));
    this.registerMethod('addCOGLayer', this.handleAddCOGLayer.bind(this));
    this.registerMethod('addDeckGLLayer', this.handleAddDeckGLLayer.bind(this));

    // Layer management
    this.registerMethod('removeDeckLayer', this.handleRemoveDeckLayer.bind(this));
    this.registerMethod('updateDeckLayer', this.handleUpdateDeckLayer.bind(this));
    this.registerMethod('setDeckLayerVisibility', this.handleSetDeckLayerVisibility.bind(this));
  }

  /**
   * Update deck.gl layers.
   */
  private updateDeckOverlay(): void {
    if (this.deckOverlay) {
      const layers = Array.from(this.deckLayers.values());
      this.deckOverlay.setProps({ layers });
    }
  }

  private makeAccessor(value: unknown, defaultProp: string, fallbackFn?: (d: any) => any): unknown {
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

  private normalizeTimestampValues(value: unknown): number[] {
    if (typeof value === 'number' && Number.isFinite(value)) {
      return [value];
    }
    if (Array.isArray(value)) {
      return value.filter((v): v is number => typeof v === 'number' && Number.isFinite(v));
    }
    if (value && typeof value === 'object' && typeof (value as ArrayLike<number>).length === 'number') {
      return Array.from(value as ArrayLike<number>).filter((v): v is number => typeof v === 'number' && Number.isFinite(v));
    }
    return [];
  }

  private getMaxTimestamp(data: unknown[], accessor: unknown): number {
    let maxTimestamp = 0;
    for (const row of data) {
      const value = typeof accessor === 'function' ? (accessor as (d: unknown) => unknown)(row) : accessor;
      for (const timestamp of this.normalizeTimestampValues(value)) {
        if (timestamp > maxTimestamp) {
          maxTimestamp = timestamp;
        }
      }
    }
    return maxTimestamp;
  }

  private startTripsAnimation(
    layerId: string,
    trailLength: number,
    startTime: number,
    speed: number,
  ): void {
    this.stopTripsAnimation(layerId);

    const config = this.tripsLayerConfigs.get(layerId);
    if (!config) return;

    const maxTimestamp = this.getMaxTimestamp(config.data, config.getTimestamps);
    const loopLength = Math.max(maxTimestamp + trailLength, trailLength * 2);
    const state = {
      frameId: 0,
      lastTime: 0,
      speed,
      loopLength,
      currentTime: startTime,
    };

    const animate = (now: number) => {
      const current = this.tripsAnimations.get(layerId);
      if (!current) return;

      const cfg = this.tripsLayerConfigs.get(layerId);
      if (!cfg) return;

      if (!current.lastTime) {
        current.lastTime = now;
      }
      const deltaSeconds = (now - current.lastTime) / 1000;
      current.lastTime = now;
      current.currentTime = (current.currentTime + deltaSeconds * current.speed) % current.loopLength;

      // Get current visibility/opacity from existing layer
      const existing = this.deckLayers.get(layerId) as { props?: { visible?: boolean; opacity?: number } } | undefined;
      const visible = existing?.props?.visible ?? true;
      const opacity = existing?.props?.opacity ?? cfg.opacity;

      // Create a new TripsLayer with updated currentTime (don't use clone)
      const updatedLayer = new TripsLayer({
        id: cfg.id,
        data: cfg.data,
        pickable: cfg.pickable,
        opacity,
        visible,
        widthMinPixels: cfg.widthMinPixels,
        trailLength: cfg.trailLength,
        currentTime: current.currentTime,
        fadeTrail: cfg.fadeTrail,
        jointRounded: cfg.jointRounded,
        capRounded: cfg.capRounded,
        getPath: cfg.getPath,
        getTimestamps: cfg.getTimestamps,
        getColor: cfg.getColor,
      });

      this.deckLayers.set(layerId, updatedLayer);
      this.updateDeckOverlay();

      current.frameId = requestAnimationFrame(animate);
    };

    state.frameId = requestAnimationFrame(animate);
    this.tripsAnimations.set(layerId, state);
  }

  private stopTripsAnimation(layerId: string): void {
    const animation = this.tripsAnimations.get(layerId);
    if (!animation) return;
    cancelAnimationFrame(animation.frameId);
    this.tripsAnimations.delete(layerId);
  }

  // -------------------------------------------------------------------------
  // DeckGL Layer Handlers
  // -------------------------------------------------------------------------

  private handleAddScatterplotLayer(args: unknown[], kwargs: Record<string, unknown>): void {
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
      getPosition: this.makeAccessor(
        kwargs.getPosition,
        'coordinates',
        (d: any) => d.coordinates || d.position || [d.lng || d.longitude, d.lat || d.latitude],
      ),
      getRadius: this.makeAccessor(kwargs.getRadius ?? kwargs.radius, 'radius', () => 5),
      getFillColor: this.makeAccessor(kwargs.getFillColor ?? kwargs.fillColor, 'fillColor', () => [51, 136, 255, 200]),
      getLineColor: this.makeAccessor(kwargs.getLineColor ?? kwargs.lineColor, 'lineColor', () => [255, 255, 255, 255]),
    });

    this.deckLayers.set(id, layer);
    this.updateDeckOverlay();
  }

  private handleAddArcLayer(args: unknown[], kwargs: Record<string, unknown>): void {
    const id = kwargs.id as string || `arc-${Date.now()}`;
    const data = kwargs.data as unknown[];

    const layer = new ArcLayer({
      id,
      data,
      pickable: kwargs.pickable !== false,
      opacity: kwargs.opacity as number ?? 0.8,
      getWidth: this.makeAccessor(kwargs.getWidth ?? kwargs.width, 'width', () => 1),
      getSourcePosition: this.makeAccessor(kwargs.getSourcePosition, 'source', (d: any) => d.source || d.from || d.sourcePosition),
      getTargetPosition: this.makeAccessor(kwargs.getTargetPosition, 'target', (d: any) => d.target || d.to || d.targetPosition),
      getSourceColor: this.makeAccessor(kwargs.getSourceColor ?? kwargs.sourceColor, 'sourceColor', () => [51, 136, 255, 255]),
      getTargetColor: this.makeAccessor(kwargs.getTargetColor ?? kwargs.targetColor, 'targetColor', () => [255, 136, 51, 255]),
    });

    this.deckLayers.set(id, layer);
    this.updateDeckOverlay();
  }

  private handleAddPathLayer(args: unknown[], kwargs: Record<string, unknown>): void {
    const id = kwargs.id as string || `path-${Date.now()}`;
    const data = kwargs.data as unknown[];

    const layer = new PathLayer({
      id,
      data,
      pickable: kwargs.pickable !== false,
      opacity: kwargs.opacity as number ?? 0.8,
      widthScale: kwargs.widthScale as number ?? 1,
      widthMinPixels: kwargs.widthMinPixels as number ?? 1,
      getPath: this.makeAccessor(kwargs.getPath, 'path', (d: any) => d.path || d.coordinates),
      getColor: this.makeAccessor(kwargs.getColor ?? kwargs.color, 'color', () => [51, 136, 255, 200]),
      getWidth: this.makeAccessor(kwargs.getWidth ?? kwargs.width, 'width', () => 1),
    });

    this.deckLayers.set(id, layer);
    this.updateDeckOverlay();
  }

  private handleAddPolygonLayer(args: unknown[], kwargs: Record<string, unknown>): void {
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
      getPolygon: this.makeAccessor(kwargs.getPolygon, 'polygon', (d: any) => d.polygon || d.contour || d.coordinates),
      getElevation: this.makeAccessor(kwargs.getElevation ?? kwargs.elevation, 'elevation', () => 0),
      getFillColor: this.makeAccessor(kwargs.getFillColor ?? kwargs.fillColor, 'fillColor', () => [51, 136, 255, 128]),
      getLineColor: this.makeAccessor(kwargs.getLineColor ?? kwargs.lineColor, 'lineColor', () => [0, 0, 255, 255]),
      getLineWidth: this.makeAccessor(kwargs.getLineWidth ?? kwargs.lineWidth, 'lineWidth', () => 1),
    });

    this.deckLayers.set(id, layer);
    this.updateDeckOverlay();
  }

  private handleAddHexagonLayer(args: unknown[], kwargs: Record<string, unknown>): void {
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
      getPosition: this.makeAccessor(
        kwargs.getPosition,
        'coordinates',
        (d: any) => d.coordinates || d.position || [d.lng || d.longitude, d.lat || d.latitude],
      ),
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
  }

  private handleAddHeatmapLayer(args: unknown[], kwargs: Record<string, unknown>): void {
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
      getPosition: this.makeAccessor(
        kwargs.getPosition,
        'coordinates',
        (d: any) => d.coordinates || d.position || [d.lng || d.longitude, d.lat || d.latitude],
      ),
      getWeight: this.makeAccessor(kwargs.getWeight ?? kwargs.weight, 'weight', () => 1),
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
  }

  private handleAddGridLayer(args: unknown[], kwargs: Record<string, unknown>): void {
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
      getPosition: this.makeAccessor(
        kwargs.getPosition,
        'coordinates',
        (d: any) => d.coordinates || d.position || [d.lng || d.longitude, d.lat || d.latitude],
      ),
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
  }

  private handleAddIconLayer(args: unknown[], kwargs: Record<string, unknown>): void {
    const id = kwargs.id as string || `icon-${Date.now()}`;
    const data = kwargs.data as unknown[];

    const layer = new IconLayer({
      id,
      data,
      pickable: kwargs.pickable !== false,
      opacity: kwargs.opacity as number ?? 1,
      iconAtlas: kwargs.iconAtlas as string,
      iconMapping: kwargs.iconMapping as Record<string, unknown>,
      getPosition: this.makeAccessor(
        kwargs.getPosition,
        'coordinates',
        (d: any) => d.coordinates || d.position || [d.lng || d.longitude, d.lat || d.latitude],
      ),
      getIcon: this.makeAccessor(kwargs.getIcon, 'icon', (d: any) => d.icon || 'marker'),
      getSize: this.makeAccessor(kwargs.getSize ?? kwargs.size, 'size', () => 20),
      getColor: this.makeAccessor(kwargs.getColor ?? kwargs.color, 'color', () => [255, 255, 255, 255]),
    });

    this.deckLayers.set(id, layer);
    this.updateDeckOverlay();
  }

  private handleAddTextLayer(args: unknown[], kwargs: Record<string, unknown>): void {
    const id = kwargs.id as string || `text-${Date.now()}`;
    const data = kwargs.data as unknown[];

    const layer = new TextLayer({
      id,
      data,
      pickable: kwargs.pickable !== false,
      opacity: kwargs.opacity as number ?? 1,
      getPosition: this.makeAccessor(
        kwargs.getPosition,
        'coordinates',
        (d: any) => d.coordinates || d.position || [d.lng || d.longitude, d.lat || d.latitude],
      ),
      getText: this.makeAccessor(kwargs.getText, 'text', (d: any) => d.text || d.label || d.name || ''),
      getSize: this.makeAccessor(kwargs.getSize ?? kwargs.size, 'size', () => 12),
      getColor: this.makeAccessor(kwargs.getColor ?? kwargs.color, 'color', () => [0, 0, 0, 255]),
      getAngle: this.makeAccessor(kwargs.getAngle, 'angle', () => 0),
      getTextAnchor: kwargs.getTextAnchor ?? 'middle',
      getAlignmentBaseline: kwargs.getAlignmentBaseline ?? 'center',
    });

    this.deckLayers.set(id, layer);
    this.updateDeckOverlay();
  }

  private handleAddGeoJsonLayer(args: unknown[], kwargs: Record<string, unknown>): void {
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
      getFillColor: this.makeAccessor(kwargs.getFillColor ?? kwargs.fillColor, 'fillColor', () => [51, 136, 255, 128]),
      getLineColor: this.makeAccessor(kwargs.getLineColor ?? kwargs.lineColor, 'lineColor', () => [0, 0, 0, 255]),
      getLineWidth: this.makeAccessor(kwargs.getLineWidth ?? kwargs.lineWidth, 'lineWidth', () => 1),
      getPointRadius: this.makeAccessor(kwargs.getPointRadius ?? kwargs.pointRadius, 'pointRadius', () => 5),
      getElevation: this.makeAccessor(kwargs.getElevation ?? kwargs.elevation, 'elevation', () => 0),
    });

    this.deckLayers.set(id, layer);
    this.updateDeckOverlay();
  }

  private handleAddContourLayer(args: unknown[], kwargs: Record<string, unknown>): void {
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
      getPosition: this.makeAccessor(
        kwargs.getPosition,
        'coordinates',
        (d: any) => d.coordinates || d.position || [d.lng || d.longitude, d.lat || d.latitude],
      ),
      getWeight: this.makeAccessor(kwargs.getWeight ?? kwargs.weight, 'weight', () => 1),
    });

    this.deckLayers.set(id, layer);
    this.updateDeckOverlay();
  }

  private handleAddScreenGridLayer(args: unknown[], kwargs: Record<string, unknown>): void {
    const id = kwargs.id as string || `screengrid-${Date.now()}`;
    const data = kwargs.data as unknown[];

    const layer = new ScreenGridLayer({
      id,
      data,
      pickable: kwargs.pickable !== false,
      opacity: kwargs.opacity as number ?? 0.8,
      cellSizePixels: kwargs.cellSizePixels as number ?? 50,
      getPosition: this.makeAccessor(
        kwargs.getPosition,
        'coordinates',
        (d: any) => d.coordinates || d.position || [d.lng || d.longitude, d.lat || d.latitude],
      ),
      getWeight: this.makeAccessor(kwargs.getWeight ?? kwargs.weight, 'weight', () => 1),
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
  }

  private handleAddPointCloudLayer(args: unknown[], kwargs: Record<string, unknown>): void {
    const id = kwargs.id as string || `pointcloud-${Date.now()}`;
    const data = kwargs.data as unknown[];

    const layerProps: Record<string, unknown> = {
      id,
      data,
      pickable: kwargs.pickable !== false,
      opacity: kwargs.opacity as number ?? 1,
      pointSize: kwargs.pointSize as number ?? 2,
      getPosition: this.makeAccessor(kwargs.getPosition, 'position', (d: any) => d.position || d.coordinates || [d.x, d.y, d.z]),
      getNormal: this.makeAccessor(kwargs.getNormal, 'normal', () => [0, 0, 1]),
      getColor: this.makeAccessor(kwargs.getColor ?? kwargs.color, 'color', () => [255, 255, 255, 255]),
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
  }

  private handleAddTripsLayer(args: unknown[], kwargs: Record<string, unknown>): void {
    const id = kwargs.id as string || `trips-${Date.now()}`;
    const data = kwargs.data as unknown[];

    const getTimestamps = this.makeAccessor(kwargs.getTimestamps, 'timestamps', (d: any) => d.timestamps);
    const getPath = this.makeAccessor(kwargs.getPath, 'waypoints', (d: any) => d.waypoints || d.path || d.coordinates);
    const getColor = this.makeAccessor(kwargs.getColor ?? kwargs.color, 'color', () => [253, 128, 93]);
    const fadeTrail = kwargs.fadeTrail as boolean ?? true;
    const jointRounded = kwargs.jointRounded as boolean ?? true;
    const capRounded = kwargs.capRounded as boolean ?? true;
    const pickable = kwargs.pickable !== false;
    const opacity = kwargs.opacity as number ?? 0.8;
    const widthMinPixels = kwargs.widthMinPixels as number ?? 2;
    const trailLength = kwargs.trailLength as number ?? 180;
    const currentTime = kwargs.currentTime as number ?? 0;
    const shouldAnimate = kwargs.animate !== false;

    // Store the layer config for animation rebuilding
    const config: TripsLayerConfig = {
      id,
      data,
      pickable,
      opacity,
      widthMinPixels,
      trailLength,
      fadeTrail,
      jointRounded,
      capRounded,
      getPath,
      getTimestamps,
      getColor,
    };
    this.tripsLayerConfigs.set(id, config);

    // When animating, start with currentTime=0 to avoid showing a static initial segment
    const initialTime = shouldAnimate ? 0 : currentTime;

    const layer = new TripsLayer({
      id,
      data,
      pickable,
      opacity,
      widthMinPixels,
      trailLength,
      currentTime: initialTime,
      fadeTrail,
      jointRounded,
      capRounded,
      getPath,
      getTimestamps,
      getColor,
    });

    this.deckLayers.set(id, layer);
    this.updateDeckOverlay();

    if (shouldAnimate) {
      const speed = kwargs.animationSpeed as number ?? kwargs.speed as number ?? 30;
      // Start animation from time 0 to properly show the trail building up
      this.startTripsAnimation(id, trailLength, 0, speed);
    } else {
      this.stopTripsAnimation(id);
    }
  }

  private handleAddLineLayer(args: unknown[], kwargs: Record<string, unknown>): void {
    const id = kwargs.id as string || `line-${Date.now()}`;
    const data = kwargs.data as unknown[];

    const layer = new LineLayer({
      id,
      data,
      pickable: kwargs.pickable !== false,
      opacity: kwargs.opacity as number ?? 0.8,
      widthMinPixels: kwargs.widthMinPixels as number ?? 1,
      getSourcePosition: this.makeAccessor(kwargs.getSourcePosition, 'sourcePosition', (d: any) => d.sourcePosition || d.source || d.from),
      getTargetPosition: this.makeAccessor(kwargs.getTargetPosition, 'targetPosition', (d: any) => d.targetPosition || d.target || d.to),
      getColor: this.makeAccessor(kwargs.getColor ?? kwargs.color, 'color', () => [51, 136, 255, 200]),
      getWidth: this.makeAccessor(kwargs.getWidth ?? kwargs.width, 'width', () => 1),
    });

    this.deckLayers.set(id, layer);
    this.updateDeckOverlay();
  }

  /**
   * Generic handler for adding any deck.gl layer type.
   * Routes to specific handlers based on layerType.
   */
  private handleAddDeckGLLayer(args: unknown[], kwargs: Record<string, unknown>): void {
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

  private handleAddCOGLayer(args: unknown[], kwargs: Record<string, unknown>): void {
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

    // Ensure the deck.gl overlay is initialized before adding the layer.
    if (!this.deckOverlay) {
      this.initializeDeckOverlay();
    }
    this.deckLayers.set(id, layer);
    this.updateDeckOverlay();
  }

  // -------------------------------------------------------------------------
  // Layer Management
  // -------------------------------------------------------------------------

  private handleRemoveDeckLayer(args: unknown[], kwargs: Record<string, unknown>): void {
    const [id] = args as [string];
    this.stopTripsAnimation(id);
    this.tripsLayerConfigs.delete(id);
    this.deckLayers.delete(id);
    this.updateDeckOverlay();
  }

  private handleUpdateDeckLayer(args: unknown[], kwargs: Record<string, unknown>): void {
    const id = kwargs.id as string;
    // To update, we need to create a new layer with the same type
    // This is a simplified version - full implementation would need to track layer types
    const existingLayer = this.deckLayers.get(id);
    if (existingLayer && 'clone' in existingLayer) {
      // Update the layer with new props
      const updatedLayer = (existingLayer as any).clone(kwargs);
      this.deckLayers.set(id, updatedLayer);
      this.updateDeckOverlay();
    }
  }

  private handleSetDeckLayerVisibility(args: unknown[], kwargs: Record<string, unknown>): void {
    const [id, visible] = args as [string, boolean];
    const layer = this.deckLayers.get(id);
    if (layer) {
      // Create a new layer with updated visibility
      const updatedLayer = (layer as any).clone({ visible });
      this.deckLayers.set(id, updatedLayer);
      this.updateDeckOverlay();
    }
  }

  // -------------------------------------------------------------------------
  // Cleanup
  // -------------------------------------------------------------------------

  destroy(): void {
    for (const layerId of this.tripsAnimations.keys()) {
      this.stopTripsAnimation(layerId);
    }
    if (this.deckOverlay && this.map) {
      this.map.removeControl(this.deckOverlay as any);
      this.deckOverlay = null;
    }
    this.tripsLayerConfigs.clear();
    this.deckLayers.clear();
    super.destroy();
  }
}
