/**
 * Mapbox GL JS type definitions.
 * Nearly identical to MapLibre since they share the same API heritage.
 */

export type ControlPosition = 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';

export interface LayerConfig {
  id: string;
  type: string;
  source?: string;
  'source-layer'?: string;
  paint?: Record<string, unknown>;
  layout?: Record<string, unknown>;
  filter?: unknown[];
  minzoom?: number;
  maxzoom?: number;
}

export interface SourceConfig {
  type: string;
  url?: string;
  tiles?: string[];
  data?: unknown;
  tileSize?: number;
  attribution?: string;
  minzoom?: number;
  maxzoom?: number;
}

export interface FlyToOptions {
  center: [number, number];
  zoom?: number;
  bearing?: number;
  pitch?: number;
  duration?: number;
}

export interface FitBoundsOptions {
  padding?: number | { top: number; bottom: number; left: number; right: number };
  duration?: number;
  maxZoom?: number;
}

/**
 * Default paint properties by layer type.
 */
export const DEFAULT_PAINT: Record<string, Record<string, unknown>> = {
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

/**
 * Infer layer type from geometry type.
 */
export function inferLayerType(geometryType: string): string {
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
