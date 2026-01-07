/**
 * Leaflet type definitions.
 * Note: Leaflet uses [lat, lng] order (opposite of MapLibre/Mapbox).
 */

export type ControlPosition = 'topleft' | 'topright' | 'bottomleft' | 'bottomright';

export interface TileLayerOptions {
  attribution?: string;
  minZoom?: number;
  maxZoom?: number;
  opacity?: number;
  tileSize?: number;
}

export interface GeoJSONOptions {
  style?: Record<string, unknown> | ((feature: unknown) => Record<string, unknown>);
  pointToLayer?: (feature: unknown, latlng: [number, number]) => unknown;
  onEachFeature?: (feature: unknown, layer: unknown) => void;
}

export interface MarkerOptions {
  icon?: unknown;
  draggable?: boolean;
  opacity?: number;
}

export interface FlyToOptions {
  zoom?: number;
  duration?: number;
  easeLinearity?: number;
}

export interface FitBoundsOptions {
  padding?: [number, number] | number;
  maxZoom?: number;
  animate?: boolean;
  duration?: number;
}

/**
 * Default styles for GeoJSON features.
 */
export const DEFAULT_STYLE: Record<string, Record<string, unknown>> = {
  point: {
    radius: 8,
    fillColor: '#3388ff',
    color: '#ffffff',
    weight: 2,
    opacity: 1,
    fillOpacity: 0.8,
  },
  line: {
    color: '#3388ff',
    weight: 3,
    opacity: 0.8,
  },
  polygon: {
    fillColor: '#3388ff',
    color: '#0000ff',
    weight: 2,
    opacity: 1,
    fillOpacity: 0.5,
  },
};

/**
 * Convert MapLibre/Mapbox [lng, lat] to Leaflet [lat, lng].
 */
export function toLngLat(latLng: [number, number]): [number, number] {
  return [latLng[1], latLng[0]];
}

/**
 * Convert Leaflet [lat, lng] to MapLibre/Mapbox [lng, lat].
 */
export function toLatLng(lngLat: [number, number]): [number, number] {
  return [lngLat[1], lngLat[0]];
}

/**
 * Infer geometry type from GeoJSON.
 */
export function inferGeometryType(geometryType: string): string {
  switch (geometryType) {
    case 'Point':
    case 'MultiPoint':
      return 'point';
    case 'LineString':
    case 'MultiLineString':
      return 'line';
    case 'Polygon':
    case 'MultiPolygon':
      return 'polygon';
    default:
      return 'point';
  }
}
