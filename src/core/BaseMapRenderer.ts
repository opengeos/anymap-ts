/**
 * Abstract base class for all map renderer implementations.
 * Handles anywidget model communication and state management.
 */

import type { MapWidgetModel, JsCall, JsEvent, LayerState, SourceState } from '../types/anywidget';

/**
 * Method handler function type.
 */
export type MethodHandler = (args: unknown[], kwargs: Record<string, unknown>) => void | Promise<void>;

/**
 * Abstract base class for map renderers.
 */
export abstract class BaseMapRenderer<TMap> {
  protected model: MapWidgetModel;
  protected el: HTMLElement;
  protected map: TMap | null = null;
  protected mapContainer: HTMLDivElement | null = null;
  protected lastProcessedCallId: number = 0;
  protected pendingCalls: JsCall[] = [];
  protected eventQueue: JsEvent[] = [];
  protected isMapReady: boolean = false;
  protected methodHandlers: Map<string, MethodHandler> = new Map();
  protected modelListeners: Array<() => void> = [];

  constructor(model: MapWidgetModel, el: HTMLElement) {
    this.model = model;
    this.el = el;
  }

  /**
   * Initialize the map renderer.
   */
  abstract initialize(): Promise<void>;

  /**
   * Destroy the map renderer and clean up resources.
   */
  abstract destroy(): void;

  /**
   * Create the map instance.
   */
  protected abstract createMap(): TMap;

  /**
   * Handle changes to the center trait.
   */
  protected abstract onCenterChange(): void;

  /**
   * Handle changes to the zoom trait.
   */
  protected abstract onZoomChange(): void;

  /**
   * Handle changes to the style trait.
   */
  protected abstract onStyleChange(): void;

  /**
   * Create the map container element.
   */
  protected createMapContainer(): HTMLDivElement {
    const width = this.model.get('width') || '100%';
    const height = this.model.get('height') || '400px';

    // Ensure parent element takes full width
    this.el.style.width = '100%';
    this.el.style.display = 'block';

    // If height is percentage-based, parent must also have explicit height
    if (height.endsWith('%')) {
      this.el.style.height = '100%';
    }

    const container = document.createElement('div');
    container.style.width = width;
    container.style.height = height;
    container.style.position = 'relative';
    container.style.minWidth = '200px';
    this.el.appendChild(container);
    this.mapContainer = container;
    return container;
  }

  /**
   * Set up model trait listeners.
   */
  protected setupModelListeners(): void {
    const onJsCallsChange = () => { this.processJsCalls().catch(console.error); };
    const onCenterChange = () => this.onCenterChange();
    const onZoomChange = () => this.onZoomChange();
    const onStyleChange = () => this.onStyleChange();

    this.model.on('change:_js_calls', onJsCallsChange);
    this.model.on('change:center', onCenterChange);
    this.model.on('change:zoom', onZoomChange);
    this.model.on('change:style', onStyleChange);

    this.modelListeners.push(
      () => this.model.off('change:_js_calls', onJsCallsChange),
      () => this.model.off('change:center', onCenterChange),
      () => this.model.off('change:zoom', onZoomChange),
      () => this.model.off('change:style', onStyleChange)
    );
  }

  /**
   * Remove model trait listeners.
   */
  protected removeModelListeners(): void {
    this.modelListeners.forEach(unsubscribe => unsubscribe());
    this.modelListeners = [];
  }

  /**
   * Register a method handler.
   */
  protected registerMethod(name: string, handler: MethodHandler): void {
    this.methodHandlers.set(name, handler);
  }

  /**
   * Execute a method by name.
   */
  protected async executeMethod(method: string, args: unknown[], kwargs: Record<string, unknown>): Promise<void> {
    const handler = this.methodHandlers.get(method);
    if (handler) {
      try {
        await handler(args, kwargs);
      } catch (error) {
        console.error(`Error executing method ${method}:`, error);
      }
    } else {
      console.warn(`Unknown method: ${method}`);
    }
  }

  /**
   * Process queued JavaScript calls from Python.
   */
  protected async processJsCalls(): Promise<void> {
    const calls = this.model.get('_js_calls') || [];
    const newCalls = calls.filter(call => call.id > this.lastProcessedCallId);

    for (const call of newCalls) {
      if (this.isMapReady) {
        await this.executeMethod(call.method, call.args, call.kwargs);
      } else {
        this.pendingCalls.push(call);
      }
      this.lastProcessedCallId = call.id;
    }
  }

  /**
   * Process pending calls after map is ready.
   */
  protected async processPendingCalls(): Promise<void> {
    for (const call of this.pendingCalls) {
      await this.executeMethod(call.method, call.args, call.kwargs);
    }
    this.pendingCalls = [];
  }

  /**
   * Send an event to Python.
   */
  protected sendEvent(type: string, data: unknown): void {
    const event: JsEvent = {
      type,
      data,
      timestamp: Date.now(),
    };
    this.eventQueue.push(event);
    this.model.set('_js_events', [...this.eventQueue]);
    this.model.save_changes();
  }

  /**
   * Restore persisted state (layers, sources, controls) from model.
   * Called when the map is displayed in a subsequent cell.
   */
  protected async restoreState(): Promise<void> {
    // Restore sources first
    const sources = this.model.get('_sources') || {};
    for (const [sourceId, sourceConfig] of Object.entries(sources)) {
      await this.executeMethod('addSource', [sourceId], sourceConfig as unknown as Record<string, unknown>);
    }

    // Then restore layers, ensuring correct z-order:
    // Basemap (raster) layers must be added first so they sit below vector layers.
    // Skip non-native MapLibre layer types (deck.gl, markers, etc.) — they are
    // restored via js_calls replay, not through addLayer.
    const NATIVE_LAYER_TYPES = new Set([
      'fill', 'line', 'symbol', 'circle', 'heatmap',
      'fill-extrusion', 'raster', 'hillshade', 'color-relief', 'background',
    ]);
    const layers = this.model.get('_layers') || {};
    const entries = Object.entries(layers).filter(([, cfg]) => {
      return NATIVE_LAYER_TYPES.has(cfg.type);
    });
    const basemapEntries = entries.filter(([id, cfg]) => {
      return id.startsWith('basemap-') || cfg.type === 'raster';
    });
    const otherEntries = entries.filter(([id, cfg]) => {
      return !(id.startsWith('basemap-') || cfg.type === 'raster');
    });
    const orderedEntries = [...basemapEntries, ...otherEntries];
    for (const [layerId, layerConfig] of orderedEntries) {
      this.executeMethod('addLayer', [], layerConfig as unknown as Record<string, unknown>);
    }

    // Controls are NOT restored here because they are already present in
    // _js_calls and will be replayed by processPendingCalls().  Restoring
    // them from _controls AND replaying the calls caused duplicate controls.
  }

  /**
   * Get the map instance.
   */
  getMap(): TMap | null {
    return this.map;
  }

  /**
   * Check if map is ready.
   */
  getIsMapReady(): boolean {
    return this.isMapReady;
  }

  /**
   * Get the model.
   */
  getModel(): MapWidgetModel {
    return this.model;
  }
}
