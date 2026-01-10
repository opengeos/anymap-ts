import maplibregl from 'maplibre-gl';
import { MapboxOverlay } from '@deck.gl/mapbox';
import { HexagonLayer } from '@deck.gl/aggregation-layers';
import { LayerControl } from 'maplibre-gl-layer-control';
import 'maplibre-gl-layer-control/style.css';
import { DeckLayerAdapter } from '../../src/maplibre/adapters/DeckLayerAdapter';

interface PointData {
  coordinates: [number, number];
}

// Generate random points around San Francisco
function generatePoints(count = 2000): PointData[] {
  return Array.from({ length: count }, () => ({
    coordinates: [
      -122.4 + (Math.random() - 0.5) * 0.6,
      37.8 + (Math.random() - 0.5) * 0.6,
    ] as [number, number],
  }));
}

const points = generatePoints();

const map = new maplibregl.Map({
  container: 'map',
  style: 'https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json',
  center: [-122.4, 37.8],
  zoom: 10,
  pitch: 45,
});

map.addControl(new maplibregl.NavigationControl(), 'top-right');
map.addControl(new maplibregl.ScaleControl({ unit: 'metric' }), 'bottom-right');

const deckOverlay = new MapboxOverlay({ layers: [] });
const deckLayers = new Map<string, unknown>();
const deckAdapter = new DeckLayerAdapter(map, deckOverlay, deckLayers);

function updateOverlay(): void {
  deckOverlay.setProps({ layers: Array.from(deckLayers.values()) });
}

function addHexagonLayer(): void {
  const layerId = 'hexagon-density';
  const layer = new HexagonLayer<PointData>({
    id: layerId,
    data: points,
    pickable: true,
    opacity: 0.8,
    extruded: true,
    radius: 500,
    elevationScale: 4,
    getPosition: (d) => d.coordinates,
    colorRange: [
      [1, 152, 189],
      [73, 227, 206],
      [216, 254, 181],
      [254, 237, 177],
      [254, 173, 84],
      [209, 55, 78],
    ],
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

  addHexagonLayer();
});
