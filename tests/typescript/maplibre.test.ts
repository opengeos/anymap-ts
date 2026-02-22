/**
 * Tests for MapLibre renderer and anywidget render function.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { createMockModel, MockModel } from './helpers/mockModel';

// Mock the MapLibreRenderer as a class so `new MapLibreRenderer()` works
vi.mock('../../src/maplibre/MapLibreRenderer', () => {
  class MockMapLibreRenderer {
    public model: any;
    public el: any;
    private container: HTMLDivElement;
    public initialize: ReturnType<typeof vi.fn>;
    public destroy: ReturnType<typeof vi.fn>;

    constructor(model: any, el: any) {
      this.model = model;
      this.el = el;

      this.container = document.createElement('div');
      this.container.className = 'maplibregl-map';
      this.container.style.width = model.get('width') || '100%';
      this.container.style.height = model.get('height') || '400px';

      const canvas = document.createElement('canvas');
      canvas.className = 'maplibregl-canvas';
      this.container.appendChild(canvas);

      this.initialize = vi.fn(async () => {
        el.appendChild(this.container);
        // Simulate the real renderer registering model listeners
        model.on('change:center', () => {});
        model.on('change:zoom', () => {});
        model.on('change:style', () => {});
        model.on('change:_js_calls', () => {});
      });

      this.destroy = vi.fn(() => {
        this.container.remove();
      });
    }
  }

  return { MapLibreRenderer: MockMapLibreRenderer };
});

describe('MapLibre anywidget render', () => {
  let model: MockModel;
  let el: HTMLElement;

  beforeEach(() => {
    model = createMockModel({
      width: '100%',
      height: '500px',
      style: 'https://demotiles.maplibre.org/style.json',
    });
    el = document.createElement('div');
    document.body.appendChild(el);
  });

  afterEach(() => {
    el.remove();
  });

  it('render() creates a container inside el', async () => {
    const { default: maplibreModule } = await import('../../src/maplibre/index');
    const cleanup = maplibreModule.render({ model: model as any, el });

    await vi.waitFor(() => {
      expect(el.querySelector('.maplibregl-map')).not.toBeNull();
    });

    cleanup();
  });

  it('container has correct dimensions from model', async () => {
    const { default: maplibreModule } = await import('../../src/maplibre/index');
    const cleanup = maplibreModule.render({ model: model as any, el });

    await vi.waitFor(() => {
      const container = el.querySelector('.maplibregl-map') as HTMLElement;
      expect(container).not.toBeNull();
      expect(container.style.width).toBe('100%');
      expect(container.style.height).toBe('500px');
    });

    cleanup();
  });

  it('cleanup function removes the renderer', async () => {
    const { default: maplibreModule } = await import('../../src/maplibre/index');
    const cleanup = maplibreModule.render({ model: model as any, el });

    await vi.waitFor(() => {
      expect(el.querySelector('.maplibregl-map')).not.toBeNull();
    });

    cleanup();
    expect(el._mapRenderer).toBeUndefined();
  });

  it('re-render cleans up the previous instance', async () => {
    const { default: maplibreModule } = await import('../../src/maplibre/index');

    // First render
    maplibreModule.render({ model: model as any, el });
    await vi.waitFor(() => {
      expect(el.querySelector('.maplibregl-map')).not.toBeNull();
    });

    const firstRenderer = el._mapRenderer;

    // Second render on same element
    const cleanup2 = maplibreModule.render({ model: model as any, el });
    await vi.waitFor(() => {
      expect(el._mapRenderer).not.toBe(firstRenderer);
    });

    // First renderer should have been destroyed
    expect(firstRenderer!.destroy).toHaveBeenCalled();

    cleanup2();
  });

  it('render creates a canvas element inside the map container', async () => {
    const { default: maplibreModule } = await import('../../src/maplibre/index');
    const cleanup = maplibreModule.render({ model: model as any, el });

    await vi.waitFor(() => {
      const canvas = el.querySelector('.maplibregl-canvas');
      expect(canvas).not.toBeNull();
      expect(canvas!.tagName).toBe('CANVAS');
    });

    cleanup();
  });

  it('stores renderer on el._mapRenderer', async () => {
    const { default: maplibreModule } = await import('../../src/maplibre/index');
    const cleanup = maplibreModule.render({ model: model as any, el });

    expect(el._mapRenderer).toBeDefined();

    cleanup();
  });

  it('model listeners are registered for key traits after render', async () => {
    // Before render, no listeners
    expect(model.getListeners().size).toBe(0);

    const { default: maplibreModule } = await import('../../src/maplibre/index');
    const cleanup = maplibreModule.render({ model: model as any, el });

    // Wait for async initialize to complete
    await vi.waitFor(() => {
      expect(el.querySelector('.maplibregl-map')).not.toBeNull();
    });

    // After render, listeners should be registered for key traits
    const listeners = model.getListeners();
    expect(listeners.size).toBeGreaterThan(0);
    expect(listeners.has('change:center')).toBe(true);
    expect(listeners.has('change:zoom')).toBe(true);
    expect(listeners.has('change:style')).toBe(true);
    expect(listeners.has('change:_js_calls')).toBe(true);

    cleanup();
  });

  it('render returns a cleanup function', async () => {
    const { default: maplibreModule } = await import('../../src/maplibre/index');
    const cleanup = maplibreModule.render({ model: model as any, el });

    expect(typeof cleanup).toBe('function');

    cleanup();
  });
});
