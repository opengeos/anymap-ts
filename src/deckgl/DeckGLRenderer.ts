/**
 * DeckGL renderer implementation.
 * Extends MapLibre with deck.gl layer support.
 */

import { MapboxOverlay } from '@deck.gl/mapbox';
import { ScatterplotLayer, ArcLayer, PathLayer, PolygonLayer, IconLayer, TextLayer, PointCloudLayer } from '@deck.gl/layers';
import { HexagonLayer, HeatmapLayer, GridLayer, ContourLayer, ScreenGridLayer } from '@deck.gl/aggregation-layers';
import { GeoJsonLayer } from '@deck.gl/layers';
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
export class DeckGLRenderer extends MapLibreRenderer {
  private deckOverlay: MapboxOverlay | null = null;
  private deckLayers: Map<string, unknown> = new Map();

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
    this.registerMethod('addCOGLayer', this.handleAddCOGLayer.bind(this));

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
      getPosition: kwargs.getPosition ?? ((d: any) => d.coordinates || d.position || [d.lng || d.longitude, d.lat || d.latitude]),
      getRadius: kwargs.getRadius ?? kwargs.radius ?? 5,
      getFillColor: kwargs.getFillColor ?? kwargs.fillColor ?? [51, 136, 255, 200],
      getLineColor: kwargs.getLineColor ?? kwargs.lineColor ?? [255, 255, 255, 255],
    });

    this.deckLayers.set(id, layer);
    this.updateDeckOverlay();
  }

  private handleAddArcLayer(args: unknown[], kwargs: Record<string, unknown>): void {
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
      getPath: kwargs.getPath ?? ((d: any) => d.path || d.coordinates),
      getColor: kwargs.getColor ?? kwargs.color ?? [51, 136, 255, 200],
      getWidth: kwargs.getWidth ?? kwargs.width ?? 1,
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
      getPolygon: kwargs.getPolygon ?? ((d: any) => d.polygon || d.contour || d.coordinates),
      getElevation: kwargs.getElevation ?? kwargs.elevation ?? 0,
      getFillColor: kwargs.getFillColor ?? kwargs.fillColor ?? [51, 136, 255, 128],
      getLineColor: kwargs.getLineColor ?? kwargs.lineColor ?? [0, 0, 255, 255],
      getLineWidth: kwargs.getLineWidth ?? kwargs.lineWidth ?? 1,
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
      getPosition: kwargs.getPosition ?? ((d: any) => d.coordinates || d.position || [d.lng || d.longitude, d.lat || d.latitude]),
      getIcon: kwargs.getIcon ?? ((d: any) => d.icon || 'marker'),
      getSize: kwargs.getSize ?? kwargs.size ?? 20,
      getColor: kwargs.getColor ?? kwargs.color ?? [255, 255, 255, 255],
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
      getFillColor: kwargs.getFillColor ?? kwargs.fillColor ?? [51, 136, 255, 128],
      getLineColor: kwargs.getLineColor ?? kwargs.lineColor ?? [0, 0, 0, 255],
      getLineWidth: kwargs.getLineWidth ?? kwargs.lineWidth ?? 1,
      getPointRadius: kwargs.getPointRadius ?? kwargs.pointRadius ?? 5,
      getElevation: kwargs.getElevation ?? kwargs.elevation ?? 0,
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
      getPosition: kwargs.getPosition ?? ((d: any) => d.coordinates || d.position || [d.lng || d.longitude, d.lat || d.latitude]),
      getWeight: kwargs.getWeight ?? kwargs.weight ?? 1,
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
  }

  private handleAddPointCloudLayer(args: unknown[], kwargs: Record<string, unknown>): void {
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

    const layer = new PointCloudLayer({
      id,
      data,
      pickable: kwargs.pickable !== false,
      opacity: kwargs.opacity as number ?? 1,
      pointSize: kwargs.pointSize as number ?? 2,
      getPosition: makeAccessor(kwargs.getPosition, 'position', (d: any) => d.position || d.coordinates || [d.x, d.y, d.z]),
      getNormal: makeAccessor(kwargs.getNormal, 'normal', () => [0, 0, 1]),
      getColor: makeAccessor(kwargs.getColor ?? kwargs.color, 'color', () => [255, 255, 255, 255]),
      sizeUnits: kwargs.sizeUnits as 'pixels' | 'meters' | 'common' ?? 'pixels',
      coordinateSystem: kwargs.coordinateSystem as number,
      coordinateOrigin: kwargs.coordinateOrigin as [number, number, number],
      material: kwargs.material as boolean ?? true,
    });

    this.deckLayers.set(id, layer);
    this.updateDeckOverlay();
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
    if (this.deckOverlay && this.map) {
      this.map.removeControl(this.deckOverlay as any);
      this.deckOverlay = null;
    }
    this.deckLayers.clear();
    super.destroy();
  }
}
