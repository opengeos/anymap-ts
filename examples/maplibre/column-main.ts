import maplibregl from 'maplibre-gl';
import { MapboxOverlay } from '@deck.gl/mapbox';
import { ColumnLayer } from '@deck.gl/layers';
import { LayerControl } from 'maplibre-gl-layer-control';
import 'maplibre-gl-layer-control/style.css';
import { DeckLayerAdapter } from '../../src/maplibre/adapters/DeckLayerAdapter';

interface ColumnData {
  coordinates: [number, number];
  value: number;
}

// Generate random column data around San Francisco
function generateColumns(count = 100): ColumnData[] {
  return Array.from({ length: count }, () => ({
    coordinates: [
      -122.4 + (Math.random() - 0.5) * 0.3,
      37.8 + (Math.random() - 0.5) * 0.3,
    ] as [number, number],
    value: Math.floor(Math.random() * 5000) + 500,
  }));
}

const columns = generateColumns();

const map = new maplibregl.Map({
  container: 'map',
  style: 'https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json',
  center: [-122.4, 37.8],
  zoom: 11,
  pitch: 45,
  bearing: -17,
});

map.addControl(new maplibregl.NavigationControl(), 'top-right');
map.addControl(new maplibregl.ScaleControl({ unit: 'metric' }), 'bottom-right');

const deckOverlay = new MapboxOverlay({ layers: [] });
const deckLayers = new Map<string, unknown>();
const deckAdapter = new DeckLayerAdapter(map, deckOverlay, deckLayers);

function updateOverlay(): void {
  deckOverlay.setProps({ layers: Array.from(deckLayers.values()) });
}

function addColumnLayer(): void {
  const layerId = 'column-data';
  const layer = new ColumnLayer<ColumnData>({
    id: layerId,
    data: columns,
    pickable: true,
    opacity: 0.8,
    extruded: true,
    diskResolution: 12,
    radius: 200,
    elevationScale: 1,
    getPosition: (d) => d.coordinates,
    getFillColor: (d) => {
      const t = d.value / 5500;
      return [255 * t, 140 * (1 - t), 50, 200];
    },
    getElevation: (d) => d.value,
  });

  deckLayers.set(layerId, layer);
  updateOverlay();
  deckAdapter.notifyLayerAdded(layerId);
}

map.on('load', () => {
  map.addControl(deckOverlay as unknown as maplibregl.IControl);

  const layerControl = new LayerControl({
    collapsed: true,
    customLayerAdapters: [deckAdapter],
    panelWidth: 360,
  });
  map.addControl(layerControl as unknown as maplibregl.IControl, 'top-right');

  addColumnLayer();
});
