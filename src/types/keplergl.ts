/**
 * KeplerGL type definitions.
 */

export interface KeplerGLConfig {
  version?: string;
  config?: {
    visState?: VisState;
    mapState?: MapState;
    mapStyle?: MapStyle;
  };
}

export interface VisState {
  filters?: Filter[];
  layers?: Layer[];
  interactionConfig?: InteractionConfig;
  layerBlending?: string;
  splitMaps?: unknown[];
}

export interface MapState {
  bearing?: number;
  dragRotate?: boolean;
  latitude?: number;
  longitude?: number;
  pitch?: number;
  zoom?: number;
  isSplit?: boolean;
}

export interface MapStyle {
  styleType?: string;
  topLayerGroups?: Record<string, boolean>;
  visibleLayerGroups?: Record<string, boolean>;
  mapStyles?: Record<string, unknown>;
}

export interface Filter {
  dataId?: string[];
  id?: string;
  name?: string[];
  type?: string;
  value?: unknown;
  enlarged?: boolean;
  plotType?: string;
  animationWindow?: string;
}

export interface Layer {
  id?: string;
  type?: string;
  config?: LayerConfig;
  visualChannels?: Record<string, unknown>;
}

export interface LayerConfig {
  dataId?: string;
  label?: string;
  color?: number[];
  columns?: Record<string, string>;
  isVisible?: boolean;
  visConfig?: Record<string, unknown>;
}

export interface InteractionConfig {
  tooltip?: {
    fieldsToShow?: Record<string, unknown[]>;
    enabled?: boolean;
  };
  brush?: {
    size?: number;
    enabled?: boolean;
  };
  geocoder?: {
    enabled?: boolean;
  };
  coordinate?: {
    enabled?: boolean;
  };
}

export interface DatasetConfig {
  info?: {
    id?: string;
    label?: string;
  };
  data?: {
    fields?: Field[];
    rows?: unknown[][];
  };
}

export interface Field {
  name: string;
  type?: string;
  format?: string;
}
