/**
 * OpenLayers type definitions.
 */

export type ControlPosition = 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';

export interface OpenLayersLayerConfig {
  id: string;
  type: 'tile' | 'vector' | 'image' | 'wms' | 'wmts';
  visible?: boolean;
  opacity?: number;
  [key: string]: unknown;
}

export interface TileLayerOptions {
  url: string;
  attribution?: string;
  minZoom?: number;
  maxZoom?: number;
  opacity?: number;
}

export interface VectorLayerOptions {
  features?: unknown[];
  style?: VectorStyleOptions;
  opacity?: number;
}

export interface VectorStyleOptions {
  fillColor?: string;
  strokeColor?: string;
  strokeWidth?: number;
  radius?: number;
  image?: ImageStyleOptions;
}

export interface ImageStyleOptions {
  src?: string;
  scale?: number;
  anchor?: [number, number];
}

export interface WMSLayerOptions {
  url: string;
  params: {
    LAYERS: string;
    FORMAT?: string;
    TRANSPARENT?: boolean;
    VERSION?: string;
    [key: string]: unknown;
  };
  serverType?: 'mapserver' | 'geoserver' | 'carmentaserver' | 'qgis';
  attribution?: string;
}

export interface WMTSLayerOptions {
  url: string;
  layer: string;
  matrixSet: string;
  format?: string;
  style?: string;
  attribution?: string;
}

/**
 * Convert hex color to rgba format.
 */
export function hexToRgba(hex: string, alpha: number = 1): string {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  if (result) {
    const r = parseInt(result[1], 16);
    const g = parseInt(result[2], 16);
    const b = parseInt(result[3], 16);
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
  }
  return hex;
}
