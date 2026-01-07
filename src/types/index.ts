/**
 * Type definitions index.
 */

export * from './anywidget';
export * from './maplibre';

// Re-export GeoJSON types for convenience
export type {
  Feature,
  FeatureCollection,
  Geometry,
  Point,
  LineString,
  Polygon,
  MultiPoint,
  MultiLineString,
  MultiPolygon,
  GeoJsonProperties,
} from 'geojson';
