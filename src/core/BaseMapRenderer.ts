/**
 * Abstract base class for all map renderer implementations.
 * Handles anywidget model communication and state management.
 */

import type { MapWidgetModel, JsCall, JsEvent, LayerState, SourceState } from '../types/anywidget';

/**
 * Method handler function type.
 */
export type MethodHandler = (args: unknown[], kwargs: Record<string, unknown>) => void;

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
    // Ensure parent element takes full width
    this.el.style.width = '100%';
    this.el.style.display = 'block';

    const container = document.createElement('div');
    container.style.width = this.model.get('width') || '100%';
    container.style.height = this.model.get('height') || '400px';
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
    const onJsCallsChange = () => this.processJsCalls();
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
  protected executeMethod(method: string, args: unknown[], kwargs: Record<string, unknown>): void {
    const handler = this.methodHandlers.get(method);
    if (handler) {
      try {
        handler(args, kwargs);
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
  protected processJsCalls(): void {
    const calls = this.model.get('_js_calls') || [];
    const newCalls = calls.filter(call => call.id > this.lastProcessedCallId);

    for (const call of newCalls) {
      if (this.isMapReady) {
        this.executeMethod(call.method, call.args, call.kwargs);
      } else {
        this.pendingCalls.push(call);
      }
      this.lastProcessedCallId = call.id;
    }
  }

  /**
   * Process pending calls after map is ready.
   */
  protected processPendingCalls(): void {
    for (const call of this.pendingCalls) {
      this.executeMethod(call.method, call.args, call.kwargs);
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
   * Restore persisted state (layers, sources) from model.
   */
  protected restoreState(): void {
    // Restore sources first
    const sources = this.model.get('_sources') || {};
    for (const [sourceId, sourceConfig] of Object.entries(sources)) {
      this.executeMethod('addSource', [sourceId], sourceConfig as Record<string, unknown>);
    }

    // Then restore layers
    const layers = this.model.get('_layers') || {};
    for (const [layerId, layerConfig] of Object.entries(layers)) {
      this.executeMethod('addLayer', [], layerConfig as Record<string, unknown>);
    }
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
