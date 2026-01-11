/**
 * Type definitions for LiDAR visualization using maplibre-gl-lidar.
 */

/**
 * Position for the LiDAR control panel.
 */
export type LidarControlPosition = 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';

/**
 * Color scheme types for LiDAR visualization.
 */
export type LidarColorScheme = 'elevation' | 'intensity' | 'classification' | 'rgb';

/**
 * COPC loading mode options.
 */
export type CopcLoadingMode = 'full' | 'dynamic';

/**
 * Options for the LiDAR control panel.
 */
export interface LidarControlOptions {
  /** Position of the control panel. Default: 'top-right' */
  position?: LidarControlPosition;
  /** Whether the panel starts collapsed. Default: true */
  collapsed?: boolean;
  /** Title displayed on the panel. Default: 'LiDAR Viewer' */
  title?: string;
  /** Panel width in pixels. Default: 365 */
  panelWidth?: number;
  /** Maximum panel height in pixels. Default: 600 */
  panelMaxHeight?: number;
  /** Point size in pixels. Default: 2 */
  pointSize?: number;
  /** Layer opacity (0-1). Default: 1.0 */
  opacity?: number;
  /** Color scheme for visualization. Default: 'elevation' */
  colorScheme?: LidarColorScheme;
  /** Use percentile (2-98%) for color scaling to reduce outlier impact. Default: true */
  usePercentile?: boolean;
  /** Maximum number of points to display. Default: 1000000 */
  pointBudget?: number;
  /** Enable hover/click interactions. Default: false */
  pickable?: boolean;
  /** Auto-zoom to point cloud after loading. Default: true */
  autoZoom?: boolean;
  /** COPC loading strategy. Default: auto-detect based on file size */
  copcLoadingMode?: CopcLoadingMode;
  /** Point budget for streaming mode. Default: 5000000 */
  streamingPointBudget?: number;
  /** Maximum concurrent requests for streaming. Default: 4 */
  streamingMaxConcurrentRequests?: number;
  /** Debounce time for viewport updates (ms). Default: 150 */
  streamingViewportDebounceMs?: number;
}

/**
 * Options for programmatically loading a LiDAR layer.
 */
export interface LidarLayerOptions {
  /** Source URL or base64-encoded data */
  source: string;
  /** Unique layer identifier */
  name?: string;
  /** Color scheme for visualization. Default: 'elevation' */
  colorScheme?: LidarColorScheme;
  /** Point size in pixels. Default: 2 */
  pointSize?: number;
  /** Layer opacity (0-1). Default: 1.0 */
  opacity?: number;
  /** Enable hover/click interactions. Default: true */
  pickable?: boolean;
  /** Auto-zoom to point cloud after loading. Default: true */
  autoZoom?: boolean;
  /** Use streaming mode for large COPC files. Default: true */
  streamingMode?: boolean;
  /** Whether source is base64-encoded file data */
  isBase64?: boolean;
  /** Original filename (used for local files) */
  filename?: string;
  /** Point budget for display. Default: 1000000 */
  pointBudget?: number;
}

/**
 * Information about a loaded point cloud.
 */
export interface PointCloudInfo {
  /** Unique identifier */
  id: string;
  /** Display name */
  name: string;
  /** Total number of points */
  pointCount: number;
  /** Spatial bounds */
  bounds: {
    minX: number;
    maxX: number;
    minY: number;
    maxY: number;
    minZ: number;
    maxZ: number;
  };
  /** Whether point cloud has RGB color data */
  hasRGB: boolean;
  /** Whether point cloud has intensity data */
  hasIntensity: boolean;
  /** Whether point cloud has classification data */
  hasClassification: boolean;
  /** Source URL or filename */
  source: string;
  /** WKT coordinate system string */
  wkt?: string;
}

/**
 * Information about a picked point.
 */
export interface PickedPointInfo {
  /** Point index in the dataset */
  index: number;
  /** Longitude (WGS84) */
  longitude: number;
  /** Latitude (WGS84) */
  latitude: number;
  /** Elevation in meters */
  elevation: number;
  /** Intensity value (0-1) */
  intensity?: number;
  /** Classification code */
  classification?: number;
  /** Red color component (0-255) */
  red?: number;
  /** Green color component (0-255) */
  green?: number;
  /** Blue color component (0-255) */
  blue?: number;
  /** Additional attributes */
  attributes?: Record<string, number>;
  /** Screen X coordinate */
  x: number;
  /** Screen Y coordinate */
  y: number;
}
