/**
 * DeckGL renderer implementation.
 * Extends MapLibre with deck.gl layer support.
 */

import { MapboxOverlay } from '@deck.gl/mapbox';
import { ScatterplotLayer, ArcLayer, PathLayer, PolygonLayer, IconLayer, TextLayer, PointCloudLayer, GeoJsonLayer, LineLayer, BitmapLayer, ColumnLayer, GridCellLayer, SolidPolygonLayer } from '@deck.gl/layers';
import { HexagonLayer, HeatmapLayer, GridLayer, ContourLayer, ScreenGridLayer } from '@deck.gl/aggregation-layers';
import { TripsLayer, TileLayer, MVTLayer, Tile3DLayer, TerrainLayer, GreatCircleLayer, H3HexagonLayer, H3ClusterLayer, S2Layer, QuadkeyLayer, GeohashLayer, _WMSLayer as WMSLayer } from '@deck.gl/geo-layers';
import { SimpleMeshLayer, ScenegraphLayer } from '@deck.gl/mesh-layers';
import { registerLoaders } from '@loaders.gl/core';
import { GLTFLoader } from '@loaders.gl/gltf';
import { OBJLoader } from '@loaders.gl/obj';
import { COGLayer, proj } from '@developmentseed/deck.gl-geotiff';

// Register loaders for mesh files (GLB, glTF, OBJ)
registerLoaders([GLTFLoader, OBJLoader]);
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
  const projDefinition = toProj4(geoKeys as unknown as Parameters<typeof toProj4>[0]);

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
  protected deckOverlay: MapboxOverlay | null = null;
  protected deckLayers: globalThis.Map<string, unknown> = new globalThis.Map();
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

    // New layer types
    this.registerMethod('addBitmapLayer', this.handleAddBitmapLayer.bind(this));
    this.registerMethod('addColumnLayer', this.handleAddColumnLayer.bind(this));
    this.registerMethod('addGridCellLayer', this.handleAddGridCellLayer.bind(this));
    this.registerMethod('addSolidPolygonLayer', this.handleAddSolidPolygonLayer.bind(this));
    this.registerMethod('addTileLayer', this.handleAddDeckTileLayer.bind(this));
    this.registerMethod('addMVTLayer', this.handleAddMVTLayer.bind(this));
    this.registerMethod('addTile3DLayer', this.handleAddTile3DLayer.bind(this));
    this.registerMethod('addTerrainLayer', this.handleAddTerrainLayer.bind(this));
    this.registerMethod('addGreatCircleLayer', this.handleAddGreatCircleLayer.bind(this));
    this.registerMethod('addH3HexagonLayer', this.handleAddH3HexagonLayer.bind(this));
    this.registerMethod('addH3ClusterLayer', this.handleAddH3ClusterLayer.bind(this));
    this.registerMethod('addS2Layer', this.handleAddS2Layer.bind(this));
    this.registerMethod('addQuadkeyLayer', this.handleAddQuadkeyLayer.bind(this));
    this.registerMethod('addGeohashLayer', this.handleAddGeohashLayer.bind(this));
    this.registerMethod('addWMSLayer', this.handleAddWMSLayer.bind(this));
    this.registerMethod('addSimpleMeshLayer', this.handleAddSimpleMeshLayer.bind(this));
    this.registerMethod('addScenegraphLayer', this.handleAddScenegraphLayer.bind(this));

    // Layer management
    this.registerMethod('removeDeckLayer', this.handleRemoveDeckLayer.bind(this));
    this.registerMethod('updateDeckLayer', this.handleUpdateDeckLayer.bind(this));
    this.registerMethod('setDeckLayerVisibility', this.handleSetDeckLayerVisibility.bind(this));
  }

  /**
   * Update deck.gl layers.
   */
  protected override updateDeckOverlay(): void {
    if (this.deckOverlay) {
      const layers = Array.from(this.deckLayers.values()) as (false | null | undefined)[];
      this.deckOverlay.setProps({ layers });
    }
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private makeAccessor(value: unknown, defaultProp: string, fallbackFn?: (d: unknown) => any): any {
    if (typeof value === 'string') {
      return (d: unknown) => (d as Record<string, unknown>)[value];
    }
    if (typeof value === 'function') {
      return value;
    }
    if (value !== undefined && value !== null) {
      return value;
    }
    return fallbackFn || ((d: unknown) => (d as Record<string, unknown>)[defaultProp]);
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
      } as any);

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

  protected override handleAddScatterplotLayer(args: unknown[], kwargs: Record<string, unknown>): void {
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

  protected override handleAddArcLayer(args: unknown[], kwargs: Record<string, unknown>): void {
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

  protected override handleAddPathLayer(args: unknown[], kwargs: Record<string, unknown>): void {
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

  protected override handleAddPolygonLayer(args: unknown[], kwargs: Record<string, unknown>): void {
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

  protected override handleAddHexagonLayer(args: unknown[], kwargs: Record<string, unknown>): void {
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
      colorRange: kwargs.colorRange as unknown as undefined ?? [
        [1, 152, 189],
        [73, 227, 206],
        [216, 254, 181],
        [254, 237, 177],
        [254, 173, 84],
        [209, 55, 78],
      ] as unknown as undefined,
    } as unknown as Record<string, unknown>);

    this.deckLayers.set(id, layer);
    this.updateDeckOverlay();
  }

  protected override handleAddHeatmapLayer(args: unknown[], kwargs: Record<string, unknown>): void {
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
      colorRange: kwargs.colorRange as unknown as undefined ?? [
        [255, 255, 178, 25],
        [254, 217, 118, 85],
        [254, 178, 76, 127],
        [253, 141, 60, 170],
        [240, 59, 32, 212],
        [189, 0, 38, 255],
      ] as unknown as undefined,
    } as unknown as Record<string, unknown>);

    this.deckLayers.set(id, layer);
    this.updateDeckOverlay();
  }

  protected override handleAddGridLayer(args: unknown[], kwargs: Record<string, unknown>): void {
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
      colorRange: (kwargs.colorRange ?? [
        [1, 152, 189],
        [73, 227, 206],
        [216, 254, 181],
        [254, 237, 177],
        [254, 173, 84],
        [209, 55, 78],
      ]) as any,
    });

    this.deckLayers.set(id, layer);
    this.updateDeckOverlay();
  }

  protected override handleAddIconLayer(args: unknown[], kwargs: Record<string, unknown>): void {
    const id = kwargs.id as string || `icon-${Date.now()}`;
    const data = kwargs.data as unknown[];

    const layer = new IconLayer({
      id,
      data,
      pickable: kwargs.pickable !== false,
      opacity: kwargs.opacity as number ?? 1,
      iconAtlas: kwargs.iconAtlas as string,
      iconMapping: kwargs.iconMapping as any,
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

  protected override handleAddTextLayer(args: unknown[], kwargs: Record<string, unknown>): void {
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
      getTextAnchor: (kwargs.getTextAnchor ?? 'middle') as any,
      getAlignmentBaseline: (kwargs.getAlignmentBaseline ?? 'center') as any,
    });

    this.deckLayers.set(id, layer);
    this.updateDeckOverlay();
  }

  protected override handleAddGeoJsonLayer(args: unknown[], kwargs: Record<string, unknown>): void {
    const id = kwargs.id as string || `geojson-${Date.now()}`;
    const data = kwargs.data;

    const layer = new GeoJsonLayer({
      id,
      data: data as any,
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

  protected override handleAddContourLayer(args: unknown[], kwargs: Record<string, unknown>): void {
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

  protected override handleAddScreenGridLayer(args: unknown[], kwargs: Record<string, unknown>): void {
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
      colorRange: kwargs.colorRange as unknown as undefined ?? [
        [255, 255, 178, 25],
        [254, 217, 118, 85],
        [254, 178, 76, 127],
        [253, 141, 60, 170],
        [240, 59, 32, 212],
        [189, 0, 38, 255],
      ] as unknown as undefined,
    } as unknown as Record<string, unknown>);

    this.deckLayers.set(id, layer);
    this.updateDeckOverlay();
  }

  protected override handleAddPointCloudLayer(args: unknown[], kwargs: Record<string, unknown>): void {
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

  protected override handleAddTripsLayer(args: unknown[], kwargs: Record<string, unknown>): void {
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

  protected override handleAddLineLayer(args: unknown[], kwargs: Record<string, unknown>): void {
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

  // -------------------------------------------------------------------------
  // New Layer Handlers
  // -------------------------------------------------------------------------

  protected override handleAddBitmapLayer(args: unknown[], kwargs: Record<string, unknown>): void {
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
  }

  protected override handleAddColumnLayer(args: unknown[], kwargs: Record<string, unknown>): void {
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
      getPosition: this.makeAccessor(
        kwargs.getPosition,
        'coordinates',
        (d: any) => d.coordinates || d.position || [d.lng || d.longitude, d.lat || d.latitude],
      ),
      getFillColor: this.makeAccessor(kwargs.getFillColor ?? kwargs.fillColor, 'fillColor', () => [255, 140, 0, 200]),
      getLineColor: this.makeAccessor(kwargs.getLineColor ?? kwargs.lineColor, 'lineColor', () => [0, 0, 0, 255]),
      getElevation: this.makeAccessor(kwargs.getElevation ?? kwargs.elevation, 'elevation', () => 1000),
    });

    this.deckLayers.set(id, layer);
    this.updateDeckOverlay();
  }

  protected override handleAddGridCellLayer(args: unknown[], kwargs: Record<string, unknown>): void {
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
      getPosition: this.makeAccessor(
        kwargs.getPosition,
        'coordinates',
        (d: any) => d.coordinates || d.position || [d.lng || d.longitude, d.lat || d.latitude],
      ),
      getColor: this.makeAccessor(kwargs.getColor ?? kwargs.color, 'color', () => [255, 140, 0, 200]),
      getElevation: this.makeAccessor(kwargs.getElevation ?? kwargs.elevation, 'elevation', () => 1000),
    });

    this.deckLayers.set(id, layer);
    this.updateDeckOverlay();
  }

  protected override handleAddSolidPolygonLayer(args: unknown[], kwargs: Record<string, unknown>): void {
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
      getPolygon: this.makeAccessor(kwargs.getPolygon, 'polygon', (d: any) => d.polygon || d.contour || d.coordinates),
      getFillColor: this.makeAccessor(kwargs.getFillColor ?? kwargs.fillColor, 'fillColor', () => [51, 136, 255, 128]),
      getLineColor: this.makeAccessor(kwargs.getLineColor ?? kwargs.lineColor, 'lineColor', () => [0, 0, 0, 255]),
      getElevation: this.makeAccessor(kwargs.getElevation ?? kwargs.elevation, 'elevation', () => 0),
    });

    this.deckLayers.set(id, layer);
    this.updateDeckOverlay();
  }

  private handleAddDeckTileLayer(args: unknown[], kwargs: Record<string, unknown>): void {
    const id = kwargs.id as string || `tile-${Date.now()}`;
    const data = kwargs.data as string | string[];

    const layer = new TileLayer({
      id,
      data,
      minZoom: kwargs.minZoom as number ?? 0,
      maxZoom: kwargs.maxZoom as number ?? 19,
      tileSize: kwargs.tileSize as number ?? 256,
      pickable: kwargs.pickable as boolean ?? false,
      visible: kwargs.visible !== false,
      opacity: kwargs.opacity as number ?? 1,
      renderSubLayers: kwargs.renderSubLayers as any ?? ((props: any) => {
        const { boundingBox } = props.tile;
        return new BitmapLayer(props, {
          data: undefined,
          image: props.data,
          bounds: [boundingBox[0][0], boundingBox[0][1], boundingBox[1][0], boundingBox[1][1]],
        });
      }),
    });

    this.deckLayers.set(id, layer);
    this.updateDeckOverlay();
  }

  private handleAddMVTLayer(args: unknown[], kwargs: Record<string, unknown>): void {
    const id = kwargs.id as string || `mvt-${Date.now()}`;
    const data = kwargs.data as string | string[];

    const layer = new MVTLayer({
      id,
      data,
      minZoom: kwargs.minZoom as number ?? 0,
      maxZoom: kwargs.maxZoom as number ?? 14,
      pickable: kwargs.pickable !== false,
      visible: kwargs.visible !== false,
      opacity: kwargs.opacity as number ?? 1,
      binary: kwargs.binary as boolean ?? true,
      getFillColor: this.makeAccessor(kwargs.getFillColor ?? kwargs.fillColor, 'fillColor', () => [51, 136, 255, 128]),
      getLineColor: this.makeAccessor(kwargs.getLineColor ?? kwargs.lineColor, 'lineColor', () => [0, 0, 0, 255]),
      getLineWidth: this.makeAccessor(kwargs.getLineWidth ?? kwargs.lineWidth, 'lineWidth', () => 1),
      getPointRadius: this.makeAccessor(kwargs.getPointRadius ?? kwargs.pointRadius, 'pointRadius', () => 5),
      lineWidthMinPixels: kwargs.lineWidthMinPixels as number ?? 1,
      pointRadiusMinPixels: kwargs.pointRadiusMinPixels as number ?? 2,
    });

    this.deckLayers.set(id, layer);
    this.updateDeckOverlay();
  }

  private handleAddTile3DLayer(args: unknown[], kwargs: Record<string, unknown>): void {
    const id = kwargs.id as string || `tile3d-${Date.now()}`;
    const data = kwargs.data as string;

    const layerProps: Record<string, unknown> = {
      id,
      data,
      pickable: kwargs.pickable !== false,
      visible: kwargs.visible !== false,
      opacity: kwargs.opacity as number ?? 1,
      pointSize: kwargs.pointSize as number ?? 1,
      loadOptions: kwargs.loadOptions as Record<string, unknown> ?? {},
    };

    // Only add callback functions if they are actually provided
    if (typeof kwargs.onTilesetLoad === 'function') {
      layerProps.onTilesetLoad = kwargs.onTilesetLoad;
    }
    if (typeof kwargs.onTileLoad === 'function') {
      layerProps.onTileLoad = kwargs.onTileLoad;
    }
    if (typeof kwargs.onTileUnload === 'function') {
      layerProps.onTileUnload = kwargs.onTileUnload;
    }
    if (typeof kwargs.onTileError === 'function') {
      layerProps.onTileError = kwargs.onTileError;
    }

    const layer = new Tile3DLayer(layerProps);

    this.deckLayers.set(id, layer);
    this.updateDeckOverlay();
  }

  private handleAddTerrainLayer(args: unknown[], kwargs: Record<string, unknown>): void {
    const id = kwargs.id as string || `terrain-${Date.now()}`;
    const elevationData = kwargs.elevationData as string | string[];

    const layer = new TerrainLayer({
      id,
      elevationData,
      texture: kwargs.texture as string,
      meshMaxError: kwargs.meshMaxError as number ?? 4.0,
      bounds: kwargs.bounds as [number, number, number, number],
      elevationDecoder: kwargs.elevationDecoder as any ?? {
        rScaler: 256,
        gScaler: 1,
        bScaler: 1 / 256,
        offset: -32768,
      },
      pickable: kwargs.pickable as boolean ?? false,
      visible: kwargs.visible !== false,
      opacity: kwargs.opacity as number ?? 1,
      wireframe: kwargs.wireframe as boolean ?? false,
    });

    this.deckLayers.set(id, layer);
    this.updateDeckOverlay();
  }

  private handleAddGreatCircleLayer(args: unknown[], kwargs: Record<string, unknown>): void {
    const id = kwargs.id as string || `greatcircle-${Date.now()}`;
    const data = kwargs.data as unknown[];

    const layer = new GreatCircleLayer({
      id,
      data,
      pickable: kwargs.pickable !== false,
      opacity: kwargs.opacity as number ?? 0.8,
      getSourcePosition: this.makeAccessor(kwargs.getSourcePosition, 'source', (d: any) => d.source || d.from || d.sourcePosition),
      getTargetPosition: this.makeAccessor(kwargs.getTargetPosition, 'target', (d: any) => d.target || d.to || d.targetPosition),
      getSourceColor: this.makeAccessor(kwargs.getSourceColor ?? kwargs.sourceColor, 'sourceColor', () => [51, 136, 255, 255]),
      getTargetColor: this.makeAccessor(kwargs.getTargetColor ?? kwargs.targetColor, 'targetColor', () => [255, 136, 51, 255]),
      getWidth: this.makeAccessor(kwargs.getWidth ?? kwargs.width, 'width', () => 1),
      widthMinPixels: kwargs.widthMinPixels as number ?? 1,
      widthMaxPixels: kwargs.widthMaxPixels as number ?? Number.MAX_SAFE_INTEGER,
    });

    this.deckLayers.set(id, layer);
    this.updateDeckOverlay();
  }

  private handleAddH3HexagonLayer(args: unknown[], kwargs: Record<string, unknown>): void {
    const id = kwargs.id as string || `h3hexagon-${Date.now()}`;
    const data = kwargs.data as unknown[];

    const layer = new H3HexagonLayer({
      id,
      data,
      pickable: kwargs.pickable !== false,
      opacity: kwargs.opacity as number ?? 0.8,
      filled: kwargs.filled !== false,
      stroked: kwargs.stroked as boolean ?? true,
      extruded: kwargs.extruded as boolean ?? false,
      wireframe: kwargs.wireframe as boolean ?? false,
      elevationScale: kwargs.elevationScale as number ?? 1,
      coverage: kwargs.coverage as number ?? 1,
      highPrecision: kwargs.highPrecision as boolean ?? false,
      getHexagon: this.makeAccessor(kwargs.getHexagon, 'hexagon', (d: any) => d.hexagon || d.h3 || d.h3Index),
      getFillColor: this.makeAccessor(kwargs.getFillColor ?? kwargs.fillColor, 'fillColor', () => [51, 136, 255, 128]),
      getLineColor: this.makeAccessor(kwargs.getLineColor ?? kwargs.lineColor, 'lineColor', () => [0, 0, 0, 255]),
      getElevation: this.makeAccessor(kwargs.getElevation ?? kwargs.elevation, 'elevation', () => 0),
    });

    this.deckLayers.set(id, layer);
    this.updateDeckOverlay();
  }

  private handleAddH3ClusterLayer(args: unknown[], kwargs: Record<string, unknown>): void {
    const id = kwargs.id as string || `h3cluster-${Date.now()}`;
    const data = kwargs.data as unknown[];

    const layer = new H3ClusterLayer({
      id,
      data,
      pickable: kwargs.pickable !== false,
      opacity: kwargs.opacity as number ?? 0.8,
      filled: kwargs.filled !== false,
      stroked: kwargs.stroked as boolean ?? true,
      extruded: kwargs.extruded as boolean ?? false,
      elevationScale: kwargs.elevationScale as number ?? 1,
      getHexagons: this.makeAccessor(kwargs.getHexagons, 'hexagons', (d: any) => d.hexagons || d.h3Indexes),
      getFillColor: this.makeAccessor(kwargs.getFillColor ?? kwargs.fillColor, 'fillColor', () => [51, 136, 255, 128]),
      getLineColor: this.makeAccessor(kwargs.getLineColor ?? kwargs.lineColor, 'lineColor', () => [0, 0, 0, 255]),
      getLineWidth: this.makeAccessor(kwargs.getLineWidth ?? kwargs.lineWidth, 'lineWidth', () => 1),
    });

    this.deckLayers.set(id, layer);
    this.updateDeckOverlay();
  }

  private handleAddS2Layer(args: unknown[], kwargs: Record<string, unknown>): void {
    const id = kwargs.id as string || `s2-${Date.now()}`;
    const data = kwargs.data as unknown[];

    const layer = new S2Layer({
      id,
      data,
      pickable: kwargs.pickable !== false,
      opacity: kwargs.opacity as number ?? 0.8,
      filled: kwargs.filled !== false,
      stroked: kwargs.stroked as boolean ?? true,
      extruded: kwargs.extruded as boolean ?? false,
      wireframe: kwargs.wireframe as boolean ?? false,
      elevationScale: kwargs.elevationScale as number ?? 1,
      getS2Token: this.makeAccessor(kwargs.getS2Token, 's2Token', (d: any) => d.s2Token || d.token || d.s2),
      getFillColor: this.makeAccessor(kwargs.getFillColor ?? kwargs.fillColor, 'fillColor', () => [51, 136, 255, 128]),
      getLineColor: this.makeAccessor(kwargs.getLineColor ?? kwargs.lineColor, 'lineColor', () => [0, 0, 0, 255]),
      getLineWidth: this.makeAccessor(kwargs.getLineWidth ?? kwargs.lineWidth, 'lineWidth', () => 1),
      getElevation: this.makeAccessor(kwargs.getElevation ?? kwargs.elevation, 'elevation', () => 0),
    });

    this.deckLayers.set(id, layer);
    this.updateDeckOverlay();
  }

  private handleAddQuadkeyLayer(args: unknown[], kwargs: Record<string, unknown>): void {
    const id = kwargs.id as string || `quadkey-${Date.now()}`;
    const data = kwargs.data as unknown[];

    const layer = new QuadkeyLayer({
      id,
      data,
      pickable: kwargs.pickable !== false,
      opacity: kwargs.opacity as number ?? 0.8,
      filled: kwargs.filled !== false,
      stroked: kwargs.stroked as boolean ?? true,
      extruded: kwargs.extruded as boolean ?? false,
      wireframe: kwargs.wireframe as boolean ?? false,
      elevationScale: kwargs.elevationScale as number ?? 1,
      getQuadkey: this.makeAccessor(kwargs.getQuadkey, 'quadkey', (d: any) => d.quadkey || d.key),
      getFillColor: this.makeAccessor(kwargs.getFillColor ?? kwargs.fillColor, 'fillColor', () => [51, 136, 255, 128]),
      getLineColor: this.makeAccessor(kwargs.getLineColor ?? kwargs.lineColor, 'lineColor', () => [0, 0, 0, 255]),
      getLineWidth: this.makeAccessor(kwargs.getLineWidth ?? kwargs.lineWidth, 'lineWidth', () => 1),
      getElevation: this.makeAccessor(kwargs.getElevation ?? kwargs.elevation, 'elevation', () => 0),
    });

    this.deckLayers.set(id, layer);
    this.updateDeckOverlay();
  }

  private handleAddGeohashLayer(args: unknown[], kwargs: Record<string, unknown>): void {
    const id = kwargs.id as string || `geohash-${Date.now()}`;
    const data = kwargs.data as unknown[];

    const layer = new GeohashLayer({
      id,
      data,
      pickable: kwargs.pickable !== false,
      opacity: kwargs.opacity as number ?? 0.8,
      filled: kwargs.filled !== false,
      stroked: kwargs.stroked as boolean ?? true,
      extruded: kwargs.extruded as boolean ?? false,
      wireframe: kwargs.wireframe as boolean ?? false,
      elevationScale: kwargs.elevationScale as number ?? 1,
      getGeohash: this.makeAccessor(kwargs.getGeohash, 'geohash', (d: any) => d.geohash || d.hash),
      getFillColor: this.makeAccessor(kwargs.getFillColor ?? kwargs.fillColor, 'fillColor', () => [51, 136, 255, 128]),
      getLineColor: this.makeAccessor(kwargs.getLineColor ?? kwargs.lineColor, 'lineColor', () => [0, 0, 0, 255]),
      getLineWidth: this.makeAccessor(kwargs.getLineWidth ?? kwargs.lineWidth, 'lineWidth', () => 1),
      getElevation: this.makeAccessor(kwargs.getElevation ?? kwargs.elevation, 'elevation', () => 0),
    });

    this.deckLayers.set(id, layer);
    this.updateDeckOverlay();
  }

  private handleAddWMSLayer(args: unknown[], kwargs: Record<string, unknown>): void {
    const id = kwargs.id as string || `wms-${Date.now()}`;
    const data = kwargs.data as string;

    const layer = new WMSLayer({
      id,
      data,
      serviceType: kwargs.serviceType as 'wms' | 'template' ?? 'wms',
      layers: kwargs.layers as string[],
      pickable: kwargs.pickable as boolean ?? false,
      visible: kwargs.visible !== false,
      opacity: kwargs.opacity as number ?? 1,
    });

    this.deckLayers.set(id, layer);
    this.updateDeckOverlay();
  }

  private handleAddSimpleMeshLayer(args: unknown[], kwargs: Record<string, unknown>): void {
    const id = kwargs.id as string || `simplemesh-${Date.now()}`;
    const data = kwargs.data as unknown[];
    const mesh = kwargs.mesh;

    // Build layer props object
    const layerProps: Record<string, unknown> = {
      id,
      data,
      pickable: kwargs.pickable !== false,
      opacity: kwargs.opacity as number ?? 1,
      sizeScale: kwargs.sizeScale as number ?? 1,
      wireframe: kwargs.wireframe as boolean ?? false,
      material: kwargs.material ?? true,
      getPosition: this.makeAccessor(
        kwargs.getPosition,
        'coordinates',
        (d: any) => d.coordinates || d.position || [d.lng || d.longitude, d.lat || d.latitude],
      ),
      getColor: this.makeAccessor(kwargs.getColor ?? kwargs.color, 'color', () => [255, 255, 255, 255]),
      getOrientation: this.makeAccessor(kwargs.getOrientation, 'orientation', () => [0, 0, 0]),
      getScale: this.makeAccessor(kwargs.getScale, 'scale', () => [1, 1, 1]),
      getTranslation: this.makeAccessor(kwargs.getTranslation, 'translation', () => [0, 0, 0]),
      // Specify loaders explicitly for mesh files
      loaders: [GLTFLoader, OBJLoader],
    };

    // Only add mesh if it's provided and not undefined
    if (mesh !== undefined && mesh !== null) {
      layerProps.mesh = mesh;
    }

    // Only add texture if provided
    if (kwargs.texture) {
      layerProps.texture = kwargs.texture as string;
    }

    const layer = new SimpleMeshLayer(layerProps);

    this.deckLayers.set(id, layer);
    this.updateDeckOverlay();
  }

  private handleAddScenegraphLayer(args: unknown[], kwargs: Record<string, unknown>): void {
    const id = kwargs.id as string || `scenegraph-${Date.now()}`;
    const data = kwargs.data as unknown[];
    const scenegraph = kwargs.scenegraph;

    const layerProps: Record<string, unknown> = {
      id,
      data,
      pickable: kwargs.pickable !== false,
      opacity: kwargs.opacity as number ?? 1,
      sizeScale: kwargs.sizeScale as number ?? 1,
      sizeMinPixels: kwargs.sizeMinPixels as number ?? 0,
      sizeMaxPixels: kwargs.sizeMaxPixels as number ?? Number.MAX_SAFE_INTEGER,
      _lighting: kwargs._lighting as string ?? 'pbr',
      getPosition: this.makeAccessor(
        kwargs.getPosition,
        'coordinates',
        (d: any) => d.coordinates || d.position || [d.lng || d.longitude, d.lat || d.latitude],
      ),
      getColor: this.makeAccessor(kwargs.getColor ?? kwargs.color, 'color', () => [255, 255, 255, 255]),
      getOrientation: this.makeAccessor(kwargs.getOrientation, 'orientation', () => [0, 0, 0]),
      getScale: this.makeAccessor(kwargs.getScale, 'scale', () => [1, 1, 1]),
      getTranslation: this.makeAccessor(kwargs.getTranslation, 'translation', () => [0, 0, 0]),
      // Specify loaders explicitly for glTF/GLB files
      loaders: [GLTFLoader],
    };

    // Only add scenegraph if it's provided
    if (scenegraph !== undefined && scenegraph !== null) {
      layerProps.scenegraph = scenegraph;
    }

    // Only add animations if provided
    if (kwargs._animations !== undefined) {
      layerProps._animations = kwargs._animations;
    }

    const layer = new ScenegraphLayer(layerProps);

    this.deckLayers.set(id, layer);
    this.updateDeckOverlay();
  }

  /**
   * Generic handler for adding any deck.gl layer type.
   * Routes to specific handlers based on layerType.
   */
  protected override handleAddDeckGLLayer(args: unknown[], kwargs: Record<string, unknown>): void {
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
      // New layer types
      'BitmapLayer': this.handleAddBitmapLayer.bind(this),
      'ColumnLayer': this.handleAddColumnLayer.bind(this),
      'GridCellLayer': this.handleAddGridCellLayer.bind(this),
      'SolidPolygonLayer': this.handleAddSolidPolygonLayer.bind(this),
      'TileLayer': this.handleAddDeckTileLayer.bind(this),
      'MVTLayer': this.handleAddMVTLayer.bind(this),
      'Tile3DLayer': this.handleAddTile3DLayer.bind(this),
      'TerrainLayer': this.handleAddTerrainLayer.bind(this),
      'GreatCircleLayer': this.handleAddGreatCircleLayer.bind(this),
      'H3HexagonLayer': this.handleAddH3HexagonLayer.bind(this),
      'H3ClusterLayer': this.handleAddH3ClusterLayer.bind(this),
      'S2Layer': this.handleAddS2Layer.bind(this),
      'QuadkeyLayer': this.handleAddQuadkeyLayer.bind(this),
      'GeohashLayer': this.handleAddGeohashLayer.bind(this),
      'WMSLayer': this.handleAddWMSLayer.bind(this),
      'SimpleMeshLayer': this.handleAddSimpleMeshLayer.bind(this),
      'ScenegraphLayer': this.handleAddScenegraphLayer.bind(this),
    };

    const handler = handlerMap[layerType];
    if (handler) {
      handler(args, kwargs);
    } else {
      console.warn(`Unknown deck.gl layer type: ${layerType}`);
    }
  }

  protected override handleAddCOGLayer(args: unknown[], kwargs: Record<string, unknown>): void {
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

  protected override handleRemoveDeckLayer(args: unknown[], kwargs: Record<string, unknown>): void {
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
    if (existingLayer && typeof existingLayer === 'object' && existingLayer !== null && 'clone' in (existingLayer as object)) {
      // Update the layer with new props
      const updatedLayer = (existingLayer as any).clone(kwargs);
      this.deckLayers.set(id, updatedLayer);
      this.updateDeckOverlay();
    }
  }

  protected override handleSetDeckLayerVisibility(args: unknown[], kwargs: Record<string, unknown>): void {
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
