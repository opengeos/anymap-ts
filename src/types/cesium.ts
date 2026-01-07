/**
 * Cesium type definitions.
 */

export interface CameraPosition {
  longitude: number;
  latitude: number;
  height: number;
  heading?: number;
  pitch?: number;
  roll?: number;
}

export interface CesiumLayerConfig {
  id: string;
  type: 'imagery' | 'terrain' | '3dtiles' | 'geojson';
  visible?: boolean;
  [key: string]: unknown;
}

export interface ImageryLayerOptions {
  url: string;
  name?: string;
  alpha?: number;
  brightness?: number;
  contrast?: number;
  hue?: number;
  saturation?: number;
  gamma?: number;
}

export interface TerrainProviderOptions {
  url?: string;
  requestVertexNormals?: boolean;
  requestWaterMask?: boolean;
}

export interface Tileset3DOptions {
  url: string;
  name?: string;
  maximumScreenSpaceError?: number;
  show?: boolean;
}

export interface GeoJsonOptions {
  data: unknown;
  name?: string;
  stroke?: string;
  strokeWidth?: number;
  fill?: string;
  clampToGround?: boolean;
}

export interface FlyToOptions {
  destination: CameraPosition | number[];
  orientation?: {
    heading?: number;
    pitch?: number;
    roll?: number;
  };
  duration?: number;
}
