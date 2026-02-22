/**
 * Tests for Leaflet renderer and anywidget render function.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { createMockModel, MockModel } from './helpers/mockModel';

// Mock the LeafletRenderer as a class so `new LeafletRenderer()` works
vi.mock('../../src/leaflet/LeafletRenderer', () => {
  class MockLeafletRenderer {
    public model: any;
    public el: any;
    private container: HTMLDivElement;
    public initialize: ReturnType<typeof vi.fn>;
    public destroy: ReturnType<typeof vi.fn>;

    constructor(model: any, el: any) {
      this.model = model;
      this.el = el;

      this.container = document.createElement('div');
      this.container.className = 'leaflet-container';
      this.container.style.width = model.get('width') || '100%';
      this.container.style.height = model.get('height') || '400px';

      this.initialize = vi.fn(async () => {
        el.appendChild(this.container);
      });

      this.destroy = vi.fn(() => {
        this.container.remove();
      });
    }
  }

  return { LeafletRenderer: MockLeafletRenderer };
});

// Mock the leaflet-overrides CSS
vi.mock('../../src/leaflet/leaflet-overrides.css', () => ({}));

describe('Leaflet anywidget render', () => {
  let model: MockModel;
  let el: HTMLElement;

  beforeEach(() => {
    model = createMockModel({
      width: '100%',
      height: '400px',
      style: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
    });
    el = document.createElement('div');
    document.body.appendChild(el);
  });

  afterEach(() => {
    el.remove();
  });

  it('render() creates a Leaflet container inside el', async () => {
    const { default: leafletModule } = await import('../../src/leaflet/index');
    const cleanup = leafletModule.render({ model: model as any, el });

    await vi.waitFor(() => {
      expect(el.querySelector('.leaflet-container')).not.toBeNull();
    });

    cleanup();
  });

  it('container dimensions match model traits', async () => {
    const customModel = createMockModel({ width: '800px', height: '600px' });
    const { default: leafletModule } = await import('../../src/leaflet/index');
    const cleanup = leafletModule.render({ model: customModel as any, el });

    await vi.waitFor(() => {
      const container = el.querySelector('.leaflet-container') as HTMLElement;
      expect(container).not.toBeNull();
      expect(container.style.width).toBe('800px');
      expect(container.style.height).toBe('600px');
    });

    cleanup();
  });

  it('cleanup destroys the renderer', async () => {
    const { default: leafletModule } = await import('../../src/leaflet/index');
    const cleanup = leafletModule.render({ model: model as any, el });

    await vi.waitFor(() => {
      expect(el.querySelector('.leaflet-container')).not.toBeNull();
    });

    cleanup();
    expect(el._leafletRenderer).toBeUndefined();
  });

  it('re-render destroys the previous renderer', async () => {
    const { default: leafletModule } = await import('../../src/leaflet/index');

    const cleanup1 = leafletModule.render({ model: model as any, el });
    await vi.waitFor(() => {
      expect(el.querySelector('.leaflet-container')).not.toBeNull();
    });

    const firstRenderer = el._leafletRenderer;

    const cleanup2 = leafletModule.render({ model: model as any, el });
    await vi.waitFor(() => {
      expect(el._leafletRenderer).not.toBe(firstRenderer);
    });

    expect(firstRenderer!.destroy).toHaveBeenCalled();
    cleanup2();
  });

  it('stores renderer on el._leafletRenderer', async () => {
    const { default: leafletModule } = await import('../../src/leaflet/index');
    const cleanup = leafletModule.render({ model: model as any, el });

    expect(el._leafletRenderer).toBeDefined();

    cleanup();
  });
});
