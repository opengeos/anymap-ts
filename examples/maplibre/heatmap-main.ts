import maplibregl from 'maplibre-gl';
import { MapboxOverlay } from '@deck.gl/mapbox';
import { HeatmapLayer } from '@deck.gl/aggregation-layers';
import { LayerControl } from 'maplibre-gl-layer-control';
import 'maplibre-gl-layer-control/style.css';
import { DeckLayerAdapter } from '../../src/maplibre/adapters/DeckLayerAdapter';

interface PointData {
  coordinates: [number, number];
  weight: number;
}

// Generate random points around San Francisco
function generatePoints(count = 2000): PointData[] {
  return Array.from({ length: count }, () => ({
    coordinates: [
      -122.4 + (Math.random() - 0.5) * 0.5,
      37.8 + (Math.random() - 0.5) * 0.5,
    ] as [number, number],
    weight: Math.random(),
  }));
}

const points = generatePoints();

const map = new maplibregl.Map({
  container: 'map',
  style: 'https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json',
  center: [-122.4, 37.8],
  zoom: 11,
});

map.addControl(new maplibregl.NavigationControl(), 'top-right');
map.addControl(new maplibregl.ScaleControl({ unit: 'metric' }), 'bottom-right');

const deckOverlay = new MapboxOverlay({ layers: [] });
const deckLayers = new Map<string, unknown>();
const deckAdapter = new DeckLayerAdapter(map, deckOverlay, deckLayers);

function updateOverlay(): void {
  deckOverlay.setProps({ layers: Array.from(deckLayers.values()) as any[] });
}

function addHeatmapLayer(): void {
  const layerId = 'heatmap-density';
  const layer = new HeatmapLayer<PointData>({
    id: layerId,
    data: points,
    pickable: false,
    opacity: 1,
    radiusPixels: 40,
    intensity: 1,
    threshold: 0.05,
    getPosition: (d) => d.coordinates,
    getWeight: (d) => d.weight,
    colorRange: [
      [255, 255, 178, 25],
      [254, 217, 118, 85],
      [254, 178, 76, 127],
      [253, 141, 60, 170],
      [240, 59, 32, 212],
      [189, 0, 38, 255],
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

  addHeatmapLayer();
});
