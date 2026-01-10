import maplibregl from 'maplibre-gl';
import { MapboxOverlay } from '@deck.gl/mapbox';
import { ScatterplotLayer } from '@deck.gl/layers';
import { LayerControl } from 'maplibre-gl-layer-control';
import 'maplibre-gl-layer-control/style.css';
import { DeckLayerAdapter } from '../../src/maplibre/adapters/DeckLayerAdapter';

interface PointData {
  coordinates: [number, number];
  value: number;
}

// Generate random points around San Francisco
function generatePoints(count = 500): PointData[] {
  return Array.from({ length: count }, () => ({
    coordinates: [
      -122.4 + (Math.random() - 0.5) * 0.4,
      37.8 + (Math.random() - 0.5) * 0.4,
    ] as [number, number],
    value: Math.floor(Math.random() * 100) + 1,
  }));
}

const points = generatePoints();

const map = new maplibregl.Map({
  container: 'map',
  style: 'https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json',
  center: [-122.4, 37.8],
  zoom: 10,
});

map.addControl(new maplibregl.NavigationControl(), 'top-right');
map.addControl(new maplibregl.ScaleControl({ unit: 'metric' }), 'bottom-right');

const deckOverlay = new MapboxOverlay({ layers: [] });
const deckLayers = new Map<string, unknown>();
const deckAdapter = new DeckLayerAdapter(map, deckOverlay, deckLayers);

function updateOverlay(): void {
  deckOverlay.setProps({ layers: Array.from(deckLayers.values()) });
}

function addScatterplotLayer(): void {
  const layerId = 'scatterplot-points';
  const layer = new ScatterplotLayer<PointData>({
    id: layerId,
    data: points,
    pickable: true,
    opacity: 0.8,
    stroked: true,
    filled: true,
    radiusScale: 10,
    radiusMinPixels: 2,
    radiusMaxPixels: 30,
    lineWidthMinPixels: 1,
    getPosition: (d) => d.coordinates,
    getRadius: (d) => d.value,
    getFillColor: [255, 140, 0, 200],
    getLineColor: [255, 255, 255, 200],
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

  addScatterplotLayer();
});
