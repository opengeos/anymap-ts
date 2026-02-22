/**
 * Mock MapWidgetModel factory for testing renderers.
 *
 * Implements the MapWidgetModel interface with an in-memory store,
 * event listeners, and a trigger() helper for simulating trait changes.
 */

import { vi } from 'vitest';
import type { MapWidgetModel, JsCall, JsEvent, LayerState, SourceState, ControlState } from '../../../src/types/anywidget';

interface MockModelOptions {
  center?: [number, number];
  zoom?: number;
  width?: string;
  height?: string;
  style?: string | Record<string, unknown>;
  bearing?: number;
  pitch?: number;
  _js_calls?: JsCall[];
  _layers?: Record<string, LayerState>;
  _sources?: Record<string, SourceState>;
  _controls?: Record<string, ControlState>;
}

export interface MockModel extends MapWidgetModel {
  /** Trigger a model event (e.g., 'change:center') to simulate trait changes. */
  trigger(event: string, ...args: unknown[]): void;
  /** Get all registered listeners for inspection. */
  getListeners(): Map<string, Array<(...args: unknown[]) => void>>;
}

export function createMockModel(options: MockModelOptions = {}): MockModel {
  const store = new Map<string, unknown>();
  const listeners = new Map<string, Array<(...args: unknown[]) => void>>();

  // Set defaults
  store.set('center', options.center ?? [0, 0]);
  store.set('zoom', options.zoom ?? 2);
  store.set('width', options.width ?? '100%');
  store.set('height', options.height ?? '400px');
  store.set('style', options.style ?? 'https://demotiles.maplibre.org/style.json');
  store.set('bearing', options.bearing ?? 0);
  store.set('pitch', options.pitch ?? 0);
  store.set('max_pitch', 85);
  store.set('_js_calls', options._js_calls ?? []);
  store.set('_js_events', []);
  store.set('_layers', options._layers ?? {});
  store.set('_sources', options._sources ?? {});
  store.set('_controls', options._controls ?? {});
  store.set('clicked', null);
  store.set('current_bounds', null);
  store.set('current_center', [0, 0]);
  store.set('current_zoom', 0);
  store.set('_draw_data', null);
  store.set('_queried_features', {});

  const model: MockModel = {
    get(key: string): any {
      return store.get(key);
    },

    set(key: string, value: unknown): void {
      store.set(key, value);
    },

    save_changes: vi.fn(),

    on(event: string, callback: (...args: any[]) => void): void {
      if (!listeners.has(event)) {
        listeners.set(event, []);
      }
      listeners.get(event)!.push(callback);
    },

    off(event: string, callback?: (...args: any[]) => void): void {
      if (!callback) {
        listeners.delete(event);
      } else {
        const cbs = listeners.get(event);
        if (cbs) {
          listeners.set(event, cbs.filter(cb => cb !== callback));
        }
      }
    },

    trigger(event: string, ...args: unknown[]): void {
      const cbs = listeners.get(event);
      if (cbs) {
        for (const cb of cbs) {
          cb(...args);
        }
      }
    },

    getListeners(): Map<string, Array<(...args: unknown[]) => void>> {
      return listeners;
    },
  };

  return model;
}
