/**
 * Tests for BaseMapRenderer shared logic.
 *
 * Since BaseMapRenderer is abstract, we create a minimal concrete subclass
 * to test the shared functionality.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { BaseMapRenderer } from '../../src/core/BaseMapRenderer';
import { createMockModel, MockModel } from './helpers/mockModel';

/** Minimal concrete renderer for testing the abstract base class. */
class TestRenderer extends BaseMapRenderer<Record<string, unknown>> {
  public initializeCalled = false;
  public destroyCalled = false;
  public centerChangeCalled = false;
  public zoomChangeCalled = false;
  public styleChangeCalled = false;

  async initialize(): Promise<void> {
    this.initializeCalled = true;
    this.createMapContainer();
    this.map = {};
    this.setupModelListeners();
    this.isMapReady = true;
    this.processPendingCalls();
  }

  destroy(): void {
    this.destroyCalled = true;
    this.removeModelListeners();
    if (this.mapContainer) {
      this.mapContainer.remove();
      this.mapContainer = null;
    }
    this.map = null;
  }

  protected createMap(): Record<string, unknown> {
    return {};
  }

  protected onCenterChange(): void {
    this.centerChangeCalled = true;
  }

  protected onZoomChange(): void {
    this.zoomChangeCalled = true;
  }

  protected onStyleChange(): void {
    this.styleChangeCalled = true;
  }

  // Expose protected methods for testing
  public testCreateMapContainer() {
    return this.createMapContainer();
  }

  public testRegisterMethod(name: string, handler: (args: unknown[], kwargs: Record<string, unknown>) => void) {
    this.registerMethod(name, handler);
  }

  public testExecuteMethod(method: string, args: unknown[], kwargs: Record<string, unknown>) {
    this.executeMethod(method, args, kwargs);
  }

  public testProcessJsCalls() {
    this.processJsCalls();
  }

  public testSendEvent(type: string, data: unknown) {
    this.sendEvent(type, data);
  }

  public testRemoveModelListeners() {
    this.removeModelListeners();
  }

  public getIsReady() {
    return this.isMapReady;
  }

  public setIsReady(ready: boolean) {
    this.isMapReady = ready;
  }

  public getPendingCalls() {
    return this.pendingCalls;
  }
}

describe('BaseMapRenderer', () => {
  let model: MockModel;
  let el: HTMLElement;
  let renderer: TestRenderer;

  beforeEach(() => {
    model = createMockModel();
    el = document.createElement('div');
    renderer = new TestRenderer(model, el);
  });

  describe('createMapContainer', () => {
    it('creates a div with correct dimensions from model', () => {
      const container = renderer.testCreateMapContainer();

      expect(container).toBeInstanceOf(HTMLDivElement);
      expect(container.style.width).toBe('100%');
      expect(container.style.height).toBe('400px');
      expect(container.style.position).toBe('relative');
      expect(container.style.minWidth).toBe('200px');
    });

    it('appends the container to the el element', () => {
      renderer.testCreateMapContainer();

      expect(el.children.length).toBe(1);
      expect(el.children[0].tagName).toBe('DIV');
    });

    it('uses custom width/height from model', () => {
      const customModel = createMockModel({ width: '800px', height: '600px' });
      const customRenderer = new TestRenderer(customModel, el);
      const container = customRenderer.testCreateMapContainer();

      expect(container.style.width).toBe('800px');
      expect(container.style.height).toBe('600px');
    });

    it('sets parent height to 100% for percentage-based heights', () => {
      const pctModel = createMockModel({ height: '50%' });
      const pctRenderer = new TestRenderer(pctModel, el);
      pctRenderer.testCreateMapContainer();

      expect(el.style.height).toBe('100%');
    });
  });

  describe('registerMethod / executeMethod', () => {
    it('dispatches to the correct registered handler', () => {
      const handler = vi.fn();
      renderer.testRegisterMethod('testMethod', handler);
      renderer.testExecuteMethod('testMethod', ['arg1'], { key: 'value' });

      expect(handler).toHaveBeenCalledWith(['arg1'], { key: 'value' });
    });

    it('logs a warning for unknown methods', () => {
      const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
      renderer.testExecuteMethod('unknownMethod', [], {});

      expect(warnSpy).toHaveBeenCalledWith('Unknown method: unknownMethod');
      warnSpy.mockRestore();
    });

    it('catches errors thrown by handlers', () => {
      const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      renderer.testRegisterMethod('failingMethod', () => {
        throw new Error('handler error');
      });
      renderer.testExecuteMethod('failingMethod', [], {});

      expect(errorSpy).toHaveBeenCalled();
      errorSpy.mockRestore();
    });
  });

  describe('processJsCalls', () => {
    it('skips already-processed calls by id', () => {
      const handler = vi.fn();
      renderer.testRegisterMethod('testMethod', handler);
      renderer.setIsReady(true);

      model.set('_js_calls', [
        { id: 1, method: 'testMethod', args: [], kwargs: {} },
        { id: 2, method: 'testMethod', args: [], kwargs: {} },
      ]);
      renderer.testProcessJsCalls();
      expect(handler).toHaveBeenCalledTimes(2);

      // Process again — should not re-execute
      handler.mockClear();
      renderer.testProcessJsCalls();
      expect(handler).not.toHaveBeenCalled();
    });

    it('queues calls when map is not ready', () => {
      renderer.setIsReady(false);
      model.set('_js_calls', [
        { id: 1, method: 'testMethod', args: ['a'], kwargs: {} },
      ]);
      renderer.testProcessJsCalls();

      expect(renderer.getPendingCalls()).toHaveLength(1);
      expect(renderer.getPendingCalls()[0].method).toBe('testMethod');
    });

    it('processes only new calls (higher id than last processed)', () => {
      const handler = vi.fn();
      renderer.testRegisterMethod('m', handler);
      renderer.setIsReady(true);

      model.set('_js_calls', [
        { id: 1, method: 'm', args: [], kwargs: {} },
      ]);
      renderer.testProcessJsCalls();
      expect(handler).toHaveBeenCalledTimes(1);

      // Add a new call with higher id
      model.set('_js_calls', [
        { id: 1, method: 'm', args: [], kwargs: {} },
        { id: 2, method: 'm', args: ['new'], kwargs: {} },
      ]);
      handler.mockClear();
      renderer.testProcessJsCalls();
      expect(handler).toHaveBeenCalledTimes(1);
      expect(handler).toHaveBeenCalledWith(['new'], {});
    });
  });

  describe('sendEvent', () => {
    it('sets _js_events on model and calls save_changes', () => {
      renderer.testSendEvent('click', { lng: 10, lat: 20 });

      const events = model.get('_js_events');
      expect(events).toHaveLength(1);
      expect(events[0].type).toBe('click');
      expect(events[0].data).toEqual({ lng: 10, lat: 20 });
      expect(events[0].timestamp).toBeGreaterThan(0);
      expect(model.save_changes).toHaveBeenCalled();
    });

    it('accumulates events in the queue', () => {
      renderer.testSendEvent('click', { x: 1 });
      renderer.testSendEvent('moveend', { x: 2 });

      const events = model.get('_js_events');
      expect(events).toHaveLength(2);
    });
  });

  describe('model listeners', () => {
    it('registers listeners for center, zoom, style, and _js_calls on initialize', async () => {
      await renderer.initialize();

      const listeners = model.getListeners();
      expect(listeners.has('change:center')).toBe(true);
      expect(listeners.has('change:zoom')).toBe(true);
      expect(listeners.has('change:style')).toBe(true);
      expect(listeners.has('change:_js_calls')).toBe(true);
    });

    it('removeModelListeners unsubscribes all listeners', async () => {
      await renderer.initialize();
      renderer.testRemoveModelListeners();

      const listeners = model.getListeners();
      // All listener arrays should be empty after removal
      for (const [, cbs] of listeners) {
        expect(cbs).toHaveLength(0);
      }
    });

    it('triggers onCenterChange when center trait changes', async () => {
      await renderer.initialize();
      model.trigger('change:center');

      expect(renderer.centerChangeCalled).toBe(true);
    });

    it('triggers onZoomChange when zoom trait changes', async () => {
      await renderer.initialize();
      model.trigger('change:zoom');

      expect(renderer.zoomChangeCalled).toBe(true);
    });

    it('triggers onStyleChange when style trait changes', async () => {
      await renderer.initialize();
      model.trigger('change:style');

      expect(renderer.styleChangeCalled).toBe(true);
    });
  });

  describe('getters', () => {
    it('getMap returns null before initialize', () => {
      expect(renderer.getMap()).toBeNull();
    });

    it('getMap returns the map instance after initialize', async () => {
      await renderer.initialize();
      expect(renderer.getMap()).toBeDefined();
      expect(renderer.getMap()).not.toBeNull();
    });

    it('getIsMapReady reflects readiness state', async () => {
      expect(renderer.getIsMapReady()).toBe(false);
      await renderer.initialize();
      expect(renderer.getIsMapReady()).toBe(true);
    });

    it('getModel returns the model', () => {
      expect(renderer.getModel()).toBe(model);
    });
  });
});
