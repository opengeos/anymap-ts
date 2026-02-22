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

