/**
 * anywidget type definitions for Python-JavaScript communication.
 */

import type { AnyModel } from '@anywidget/types';
import type { FeatureCollection, Feature } from 'geojson';

/**
 * JavaScript method call queued from Python.
 */
export interface JsCall {
  /** Unique call identifier */
  id: number;
  /** Method name to execute */
  method: string;
  /** Positional arguments */
  args: unknown[];
  /** Keyword arguments */
  kwargs: Record<string, unknown>;
}

/**
 * Event sent from JavaScript to Python.
 */
export interface JsEvent {
  /** Event type (e.g., 'click', 'moveend') */
  type: string;
  /** Event data payload */
  data: unknown;
  /** Event timestamp */
  timestamp: number;
}

/**
 * Clicked point information.
 */
export interface ClickedPoint {
  lng: number;
  lat: number;
  point: [number, number];
}

/**
 * Layer state for persistence.
 */
export interface LayerState {
  id: string;
  type: string;
  source: string;
  paint?: Record<string, unknown>;
  layout?: Record<string, unknown>;
  visible?: boolean;
  opacity?: number;
}

/**
 * Source state for persistence.
 */
export interface SourceState {
  type: string;
  data?: unknown;
  url?: string;
  tiles?: string[];
  tileSize?: number;
  attribution?: string;
}

/**
 * Control state for persistence.
 */
export interface ControlState {
  type: string;
  position: string;
  options?: Record<string, unknown>;
}

/**
 * MapWidget model interface for anywidget.
 */
export interface MapWidgetModel extends AnyModel {
  // Getters
  get(key: 'center'): [number, number];
  get(key: 'zoom'): number;
  get(key: 'width'): string;
  get(key: 'height'): string;
  get(key: 'style'): string | Record<string, unknown>;
  get(key: 'bearing'): number;
  get(key: 'pitch'): number;
  get(key: '_js_calls'): JsCall[];
  get(key: '_js_events'): JsEvent[];
  get(key: '_layers'): Record<string, LayerState>;
  get(key: '_sources'): Record<string, SourceState>;
  get(key: '_controls'): Record<string, ControlState>;
  get(key: '_draw_data'): FeatureCollection | null;
  get(key: 'clicked'): ClickedPoint | null;
  get(key: 'current_bounds'): [number, number, number, number] | null;
  get(key: string): unknown;

  // Setters
  set(key: 'center', value: [number, number]): void;
  set(key: 'zoom', value: number): void;
  set(key: 'clicked', value: ClickedPoint): void;
  set(key: '_js_events', value: JsEvent[]): void;
  set(key: '_draw_data', value: FeatureCollection): void;
  set(key: 'current_bounds', value: [number, number, number, number]): void;
  set(key: 'current_center', value: [number, number]): void;
  set(key: 'current_zoom', value: number): void;
  set(key: string, value: unknown): void;

  // Methods
  save_changes(): void;
  on(event: string, callback: () => void): void;
  off(event: string, callback?: () => void): void;
}

/**
 * Render context provided by anywidget.
 */
export interface RenderContext {
  model: MapWidgetModel;
  el: HTMLElement;
}
