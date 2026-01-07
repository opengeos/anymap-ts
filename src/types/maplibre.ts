/**
 * MapLibre-specific type definitions.
 */

import type { Map, LngLatLike, StyleSpecification, LngLatBoundsLike } from 'maplibre-gl';
import type { Feature, FeatureCollection, Geometry, GeoJsonProperties } from 'geojson';

/**
 * MapLibre map configuration.
 */
export interface MapLibreConfig {
  container: HTMLElement | string;
  center: LngLatLike;
  zoom: number;
  bearing?: number;
  pitch?: number;
  style: string | StyleSpecification;
  antialias?: boolean;
  doubleClickZoom?: boolean;
  attributionControl?: boolean;
}

/**
 * Supported MapLibre layer types.
 */
export type LayerType =
  | 'fill'
  | 'line'
  | 'circle'
  | 'symbol'
  | 'raster'
  | 'fill-extrusion'
  | 'heatmap'
  | 'hillshade'
  | 'background';

/**
 * MapLibre layer configuration.
 */
export interface LayerConfig {
  id: string;
  type: LayerType;
  source: string;
  'source-layer'?: string;
  paint?: Record<string, unknown>;
  layout?: Record<string, unknown>;
  filter?: unknown[];
  minzoom?: number;
  maxzoom?: number;
  metadata?: Record<string, unknown>;
}

/**
 * Supported MapLibre source types.
 */
export type SourceType =
  | 'geojson'
  | 'vector'
  | 'raster'
  | 'raster-dem'
  | 'image'
  | 'video';

/**
 * MapLibre source configuration.
 */
export interface SourceConfig {
  type: SourceType;
  data?: FeatureCollection | Feature | string;
  url?: string;
  tiles?: string[];
  tileSize?: number;
  attribution?: string;
  bounds?: [number, number, number, number];
  minzoom?: number;
  maxzoom?: number;
}

/**
 * Control position options.
 */
export type ControlPosition = 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';

/**
 * Layer control configuration.
 */
export interface LayerControlConfig {
  layers?: string[];
  position?: ControlPosition;
  collapsed?: boolean;
}

/**
 * Draw control configuration.
 */
export interface DrawControlConfig {
  position?: ControlPosition;
  drawModes?: string[];
  editModes?: string[];
  collapsed?: boolean;
}

/**
 * Fly to options.
 */
export interface FlyToOptions {
  center?: LngLatLike;
  zoom?: number;
  bearing?: number;
  pitch?: number;
  duration?: number;
  essential?: boolean;
}

/**
 * Fit bounds options.
 */
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
  'fill-extrusion': {
    'fill-extrusion-color': '#3388ff',
    'fill-extrusion-opacity': 0.6,
    'fill-extrusion-height': 100,
  },
  symbol: {
    'text-color': '#000000',
    'text-halo-color': '#ffffff',
    'text-halo-width': 1,
  },
  raster: {
    'raster-opacity': 1,
  },
  heatmap: {
    'heatmap-opacity': 0.8,
  },
};

/**
 * Infer layer type from GeoJSON geometry.
 */
export function inferLayerType(geometry: Geometry): LayerType {
  switch (geometry.type) {
    case 'Point':
    case 'MultiPoint':
      return 'circle';
    case 'LineString':
    case 'MultiLineString':
      return 'line';
    case 'Polygon':
    case 'MultiPolygon':
      return 'fill';
    case 'GeometryCollection':
      // Default to fill for geometry collections
      return 'fill';
    default:
      return 'circle';
  }
}
