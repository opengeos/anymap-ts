/**
 * Geographic coordinate conversion utilities.
 */

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
 * Infer geometry type from GeoJSON geometry type string.
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
