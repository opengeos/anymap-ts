/**
 * Potree type definitions.
 */

export interface PotreeViewerConfig {
  pointBudget?: number;
  pointSize?: number;
  fov?: number;
  background?: string;
  edlEnabled?: boolean;
  edlRadius?: number;
  edlStrength?: number;
}

export interface PointCloudConfig {
  url: string;
  name?: string;
  material?: PointCloudMaterial;
  visible?: boolean;
}

export interface PointCloudMaterial {
  size?: number;
  pointSizeType?: 'fixed' | 'attenuated' | 'adaptive';
  shape?: 'square' | 'circle' | 'paraboloid';
  activeAttributeName?: string;
  color?: string;
  opacity?: number;
}

export interface CameraConfig {
  position?: [number, number, number];
  target?: [number, number, number];
  up?: [number, number, number];
  fov?: number;
  near?: number;
  far?: number;
}

export interface MeasurementConfig {
  type: 'point' | 'distance' | 'area' | 'angle' | 'height' | 'profile';
  showLabels?: boolean;
  showArea?: boolean;
  closed?: boolean;
}

export interface AnnotationConfig {
  position: [number, number, number];
  title?: string;
  description?: string;
  cameraPosition?: [number, number, number];
  cameraTarget?: [number, number, number];
}

export interface ClippingVolumeConfig {
  type: 'box' | 'polygon' | 'plane';
  position?: [number, number, number];
  scale?: [number, number, number];
  rotation?: [number, number, number];
}
