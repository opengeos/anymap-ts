import { beforeEach, describe, expect, it, vi } from 'vitest';
import { LayerControl } from 'maplibre-gl-layer-control';
import { LayerControlPlugin } from '../../src/maplibre/plugins/LayerControlPlugin';

describe('LayerControlPlugin', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('reorders custom layers into the supplied render order', () => {
    const buildLayerItems = vi.fn();

    vi.mocked(LayerControl).mockImplementationOnce(function MockLayerControl() {
      return {
        onAdd: vi.fn(),
        onRemove: vi.fn(),
        state: {
          layerStates: {
            Background: { visible: true, opacity: 1, name: 'Background' },
            'basemap-layer': { visible: true, opacity: 1, name: 'Basemap' },
            'route-line': { visible: true, opacity: 1, name: 'Route Line' },
            'cog-landcover': { visible: true, opacity: 1, name: 'Landcover' },
            marker: { visible: true, opacity: 1, name: 'Marker' },
          },
        },
        targetLayers: ['Background', 'basemap-layer', 'route-line', 'cog-landcover', 'marker'],
        buildLayerItems,
      } as any;
    });

    const map = {
      addControl: vi.fn(),
      removeControl: vi.fn(),
    } as any;

    const plugin = new LayerControlPlugin(map);
    plugin.initialize({
      resolveLayerOrder: () => ['basemap-layer', 'cog-landcover', 'route-line'],
    });

    const control = plugin.getControl() as any;

    expect(map.addControl).toHaveBeenCalledWith(control, 'top-right');
    expect(Object.keys(control.state.layerStates)).toEqual([
      'Background',
      'basemap-layer',
      'cog-landcover',
      'route-line',
      'marker',
    ]);
    expect(control.targetLayers).toEqual([
      'Background',
      'basemap-layer',
      'cog-landcover',
      'route-line',
      'marker',
    ]);
    expect(buildLayerItems).toHaveBeenCalledTimes(1);
  });

  it('forwards layer reorder callbacks to the layer control', () => {
    const onLayerReorder = vi.fn();

    vi.mocked(LayerControl).mockImplementationOnce(function MockLayerControl() {
      return {
        onAdd: vi.fn(),
        onRemove: vi.fn(),
      } as any;
    });

    const map = {
      addControl: vi.fn(),
      removeControl: vi.fn(),
    } as any;

    const plugin = new LayerControlPlugin(map);
    plugin.initialize({ onLayerReorder });

    expect(LayerControl).toHaveBeenCalledWith(expect.objectContaining({
      onLayerReorder,
    }));
  });
});
