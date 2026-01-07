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
