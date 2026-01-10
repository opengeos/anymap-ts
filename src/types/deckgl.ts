/**
 * DeckGL type definitions.
 */

export type ControlPosition = 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';

export interface DeckGLLayerConfig {
  id: string;
  type: string;
  data: unknown;
  visible?: boolean;
  opacity?: number;
  [key: string]: unknown;
}

export interface ScatterplotLayerProps {
  id: string;
  data: unknown;
  getPosition?: unknown;
  getRadius?: number | unknown;
  getFillColor?: number[] | unknown;
  getLineColor?: number[] | unknown;
  radiusScale?: number;
  radiusMinPixels?: number;
  radiusMaxPixels?: number;
  stroked?: boolean;
  filled?: boolean;
  pickable?: boolean;
}

export interface ArcLayerProps {
  id: string;
  data: unknown;
  getSourcePosition?: unknown;
  getTargetPosition?: unknown;
  getSourceColor?: number[] | unknown;
  getTargetColor?: number[] | unknown;
  getWidth?: number | unknown;
  pickable?: boolean;
}

export interface PathLayerProps {
  id: string;
  data: unknown;
  getPath?: unknown;
  getColor?: number[] | unknown;
  getWidth?: number | unknown;
  widthMinPixels?: number;
  pickable?: boolean;
}

export interface PolygonLayerProps {
  id: string;
  data: unknown;
  getPolygon?: unknown;
  getFillColor?: number[] | unknown;
  getLineColor?: number[] | unknown;
  getLineWidth?: number | unknown;
  filled?: boolean;
  stroked?: boolean;
  pickable?: boolean;
}

export interface HexagonLayerProps {
  id: string;
  data: unknown;
  getPosition?: unknown;
  radius?: number;
  elevationRange?: [number, number];
  elevationScale?: number;
  extruded?: boolean;
  colorRange?: number[][];
  pickable?: boolean;
}

export interface HeatmapLayerProps {
  id: string;
  data: unknown;
  getPosition?: unknown;
  getWeight?: number | unknown;
  radiusPixels?: number;
  intensity?: number;
  threshold?: number;
  colorRange?: number[][];
  pickable?: boolean;
}

export interface GridLayerProps {
  id: string;
  data: unknown;
  getPosition?: unknown;
  cellSize?: number;
  elevationRange?: [number, number];
  elevationScale?: number;
  extruded?: boolean;
  colorRange?: number[][];
  pickable?: boolean;
}

export interface IconLayerProps {
  id: string;
  data: unknown;
  getPosition?: unknown;
  getIcon?: unknown;
  getSize?: number | unknown;
  getColor?: number[] | unknown;
  pickable?: boolean;
}

export interface TextLayerProps {
  id: string;
  data: unknown;
  getPosition?: unknown;
  getText?: unknown;
  getSize?: number | unknown;
  getColor?: number[] | unknown;
  getAngle?: number | unknown;
  pickable?: boolean;
}

export interface COGLayerProps {
  id: string;
  geotiff: string;
  opacity?: number;
  visible?: boolean;
  debug?: boolean;
  debugOpacity?: number;
  maxError?: number;
  beforeId?: string;
  fitBounds?: boolean;
}

// === Core Layers ===

export interface BitmapLayerProps {
  id: string;
  image: string | ImageData | HTMLImageElement | ImageBitmap;
  bounds: [number, number, number, number];
  opacity?: number;
  visible?: boolean;
  pickable?: boolean;
  desaturate?: number;
  transparentColor?: number[];
  tintColor?: number[];
}

export interface ColumnLayerProps {
  id: string;
  data: unknown;
  getPosition?: unknown;
  getFillColor?: number[] | unknown;
  getLineColor?: number[] | unknown;
  getElevation?: number | unknown;
  diskResolution?: number;
  radius?: number;
  angle?: number;
  offset?: [number, number];
  coverage?: number;
  elevationScale?: number;
  filled?: boolean;
  stroked?: boolean;
  extruded?: boolean;
  wireframe?: boolean;
  flatShading?: boolean;
  lineWidthMinPixels?: number;
  lineWidthMaxPixels?: number;
  pickable?: boolean;
}

export interface GridCellLayerProps {
  id: string;
  data: unknown;
  getPosition?: unknown;
  getColor?: number[] | unknown;
  getElevation?: number | unknown;
  cellSize?: number;
  coverage?: number;
  elevationScale?: number;
  extruded?: boolean;
  pickable?: boolean;
}

export interface SolidPolygonLayerProps {
  id: string;
  data: unknown;
  getPolygon?: unknown;
  getFillColor?: number[] | unknown;
  getLineColor?: number[] | unknown;
  getElevation?: number | unknown;
  filled?: boolean;
  extruded?: boolean;
  wireframe?: boolean;
  elevationScale?: number;
  pickable?: boolean;
}

export interface LineLayerProps {
  id: string;
  data: unknown;
  getSourcePosition?: unknown;
  getTargetPosition?: unknown;
  getColor?: number[] | unknown;
  getWidth?: number | unknown;
  widthScale?: number;
  widthMinPixels?: number;
  widthMaxPixels?: number;
  pickable?: boolean;
}

// === Geo Layers ===

export interface TileLayerProps {
  id: string;
  data: string | string[];
  minZoom?: number;
  maxZoom?: number;
  tileSize?: number;
  maxCacheSize?: number;
  maxCacheByteSize?: number;
  refinementStrategy?: 'best-available' | 'no-overlap' | 'never';
  zRange?: [number, number];
  extent?: [number, number, number, number];
  pickable?: boolean;
  visible?: boolean;
  opacity?: number;
  renderSubLayers?: unknown;
}

export interface MVTLayerProps {
  id: string;
  data: string | string[];
  minZoom?: number;
  maxZoom?: number;
  binary?: boolean;
  uniqueIdProperty?: string;
  highlightedFeatureId?: string | number;
  pickable?: boolean;
  visible?: boolean;
  opacity?: number;
  getFillColor?: number[] | unknown;
  getLineColor?: number[] | unknown;
  getLineWidth?: number | unknown;
  getPointRadius?: number | unknown;
  lineWidthMinPixels?: number;
  lineWidthMaxPixels?: number;
  pointRadiusMinPixels?: number;
  pointRadiusMaxPixels?: number;
}

export interface Tile3DLayerProps {
  id: string;
  data: string;
  loader?: unknown;
  loadOptions?: Record<string, unknown>;
  pickable?: boolean;
  visible?: boolean;
  opacity?: number;
  pointSize?: number;
  getPointColor?: number[] | unknown;
  onTilesetLoad?: unknown;
  onTileLoad?: unknown;
  onTileUnload?: unknown;
  onTileError?: unknown;
}

export interface TerrainLayerProps {
  id: string;
  elevationData: string | string[];
  texture?: string;
  meshMaxError?: number;
  elevationDecoder?: {
    rScaler: number;
    gScaler: number;
    bScaler: number;
    offset: number;
  };
  bounds?: [number, number, number, number];
  workerUrl?: string;
  pickable?: boolean;
  visible?: boolean;
  opacity?: number;
  color?: number[];
  wireframe?: boolean;
}

export interface GreatCircleLayerProps {
  id: string;
  data: unknown;
  getSourcePosition?: unknown;
  getTargetPosition?: unknown;
  getSourceColor?: number[] | unknown;
  getTargetColor?: unknown;
  getWidth?: number | unknown;
  getHeight?: number | unknown;
  widthMinPixels?: number;
  widthMaxPixels?: number;
  numSegments?: number;
  pickable?: boolean;
}

export interface H3HexagonLayerProps {
  id: string;
  data: unknown;
  getHexagon?: unknown;
  getFillColor?: number[] | unknown;
  getLineColor?: number[] | unknown;
  getElevation?: number | unknown;
  filled?: boolean;
  stroked?: boolean;
  extruded?: boolean;
  wireframe?: boolean;
  elevationScale?: number;
  coverage?: number;
  highPrecision?: boolean;
  pickable?: boolean;
}

export interface H3ClusterLayerProps {
  id: string;
  data: unknown;
  getHexagons?: unknown;
  getFillColor?: number[] | unknown;
  getLineColor?: number[] | unknown;
  getLineWidth?: number | unknown;
  stroked?: boolean;
  filled?: boolean;
  extruded?: boolean;
  elevationScale?: number;
  pickable?: boolean;
}

export interface S2LayerProps {
  id: string;
  data: unknown;
  getS2Token?: unknown;
  getFillColor?: number[] | unknown;
  getLineColor?: number[] | unknown;
  getLineWidth?: number | unknown;
  getElevation?: number | unknown;
  filled?: boolean;
  stroked?: boolean;
  extruded?: boolean;
  wireframe?: boolean;
  elevationScale?: number;
  pickable?: boolean;
}

export interface QuadkeyLayerProps {
  id: string;
  data: unknown;
  getQuadkey?: unknown;
  getFillColor?: number[] | unknown;
  getLineColor?: number[] | unknown;
  getLineWidth?: number | unknown;
  getElevation?: number | unknown;
  filled?: boolean;
  stroked?: boolean;
  extruded?: boolean;
  wireframe?: boolean;
  elevationScale?: number;
  pickable?: boolean;
}

export interface GeohashLayerProps {
  id: string;
  data: unknown;
  getGeohash?: unknown;
  getFillColor?: number[] | unknown;
  getLineColor?: number[] | unknown;
  getLineWidth?: number | unknown;
  getElevation?: number | unknown;
  filled?: boolean;
  stroked?: boolean;
  extruded?: boolean;
  wireframe?: boolean;
  elevationScale?: number;
  pickable?: boolean;
}

export interface WMSLayerProps {
  id: string;
  data: string;
  serviceType?: 'wms' | 'template';
  layers?: string[];
  srs?: string;
  pickable?: boolean;
  visible?: boolean;
  opacity?: number;
}

export interface TripsLayerProps {
  id: string;
  data: unknown;
  getPath?: unknown;
  getTimestamps?: unknown;
  getColor?: number[] | unknown;
  getWidth?: number | unknown;
  fadeTrail?: boolean;
  trailLength?: number;
  currentTime?: number;
  widthMinPixels?: number;
  widthMaxPixels?: number;
  jointRounded?: boolean;
  capRounded?: boolean;
  pickable?: boolean;
}

// === Mesh Layers ===

export interface SimpleMeshLayerProps {
  id: string;
  data: unknown;
  mesh: string | unknown;
  texture?: string;
  getPosition?: unknown;
  getColor?: number[] | unknown;
  getOrientation?: unknown;
  getScale?: unknown;
  getTranslation?: unknown;
  getTransformMatrix?: unknown;
  sizeScale?: number;
  wireframe?: boolean;
  material?: unknown;
  pickable?: boolean;
}

export interface ScenegraphLayerProps {
  id: string;
  data: unknown;
  scenegraph: string | unknown;
  getPosition?: unknown;
  getColor?: number[] | unknown;
  getOrientation?: unknown;
  getScale?: unknown;
  getTranslation?: unknown;
  getTransformMatrix?: unknown;
  sizeScale?: number;
  sizeMinPixels?: number;
  sizeMaxPixels?: number;
  _animations?: unknown;
  _lighting?: string;
  pickable?: boolean;
}

// === Aggregation Layers (additional) ===

export interface ContourLayerProps {
  id: string;
  data: unknown;
  getPosition?: unknown;
  getWeight?: number | unknown;
  cellSize?: number;
  contours?: Array<{
    threshold: number | [number, number];
    color?: number[];
    strokeWidth?: number;
    zIndex?: number;
  }>;
  gpuAggregation?: boolean;
  aggregation?: 'SUM' | 'MEAN' | 'MIN' | 'MAX';
  pickable?: boolean;
}

export interface ScreenGridLayerProps {
  id: string;
  data: unknown;
  getPosition?: unknown;
  getWeight?: number | unknown;
  cellSizePixels?: number;
  colorRange?: number[][];
  gpuAggregation?: boolean;
  aggregation?: 'SUM' | 'MEAN' | 'MIN' | 'MAX';
  pickable?: boolean;
}

export interface PointCloudLayerProps {
  id: string;
  data: unknown;
  getPosition?: unknown;
  getNormal?: unknown;
  getColor?: number[] | unknown;
  sizeUnits?: 'pixels' | 'meters' | 'common';
  pointSize?: number;
  material?: unknown;
  pickable?: boolean;
}

export interface GeoJsonLayerProps {
  id: string;
  data: unknown;
  filled?: boolean;
  stroked?: boolean;
  extruded?: boolean;
  wireframe?: boolean;
  pointType?: string;
  getFillColor?: number[] | unknown;
  getLineColor?: number[] | unknown;
  getLineWidth?: number | unknown;
  getPointRadius?: number | unknown;
  getElevation?: number | unknown;
  lineWidthMinPixels?: number;
  lineWidthMaxPixels?: number;
  lineWidthScale?: number;
  pointRadiusMinPixels?: number;
  pointRadiusMaxPixels?: number;
  pointRadiusScale?: number;
  elevationScale?: number;
  pickable?: boolean;
}

/**
 * Convert color from various formats to [r, g, b, a].
 */
export function parseColor(color: string | number[]): number[] {
  if (Array.isArray(color)) {
    return color.length === 3 ? [...color, 255] : color;
  }
  // Parse hex color
  if (color.startsWith('#')) {
    const hex = color.slice(1);
    if (hex.length === 3) {
      return [
        parseInt(hex[0] + hex[0], 16),
        parseInt(hex[1] + hex[1], 16),
        parseInt(hex[2] + hex[2], 16),
        255,
      ];
    }
    return [
      parseInt(hex.slice(0, 2), 16),
      parseInt(hex.slice(2, 4), 16),
      parseInt(hex.slice(4, 6), 16),
      hex.length === 8 ? parseInt(hex.slice(6, 8), 16) : 255,
    ];
  }
  return [51, 136, 255, 255]; // Default blue
}
