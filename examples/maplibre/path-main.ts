import maplibregl from 'maplibre-gl';
import { MapboxOverlay } from '@deck.gl/mapbox';
import { PathLayer } from '@deck.gl/layers';
import { LayerControl } from 'maplibre-gl-layer-control';
import 'maplibre-gl-layer-control/style.css';
import { DeckLayerAdapter } from '../../src/maplibre/adapters/DeckLayerAdapter';

interface PathData {
  path: [number, number][];
  color: [number, number, number, number];
  name: string;
}

// Sample route data around San Francisco Bay Area
const routes: PathData[] = [
  {
    name: 'Route 1: SF to Oakland',
    path: [
      [-122.4194, 37.7749],
      [-122.3894, 37.7849],
      [-122.3594, 37.7949],
      [-122.3294, 37.8049],
      [-122.2712, 37.8044],
    ],
    color: [255, 100, 100, 200],
  },
  {
    name: 'Route 2: SF to San Jose',
    path: [
      [-122.4194, 37.7749],
      [-122.3994, 37.7249],
      [-122.3494, 37.6549],
      [-122.2994, 37.5549],
      [-122.1994, 37.4549],
      [-121.8853, 37.3387],
    ],
    color: [100, 255, 100, 200],
  },
  {
    name: 'Route 3: SF to Sausalito',
    path: [
      [-122.4194, 37.7749],
      [-122.4394, 37.7949],
      [-122.4594, 37.8249],
      [-122.4794, 37.8549],
      [-122.4839, 37.8588],
    ],
    color: [100, 100, 255, 200],
  },
  {
    name: 'Route 4: Coastal Route',
    path: [
      [-122.5094, 37.7749],
      [-122.5094, 37.7349],
      [-122.4894, 37.6949],
      [-122.4694, 37.6549],
      [-122.4194, 37.6149],
    ],
    color: [255, 200, 100, 200],
  },
];

const map = new maplibregl.Map({
  container: 'map',
  style: 'https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json',
  center: [-122.3, 37.65],
  zoom: 9,
});

map.addControl(new maplibregl.NavigationControl(), 'top-right');
map.addControl(new maplibregl.ScaleControl({ unit: 'metric' }), 'bottom-right');

const deckOverlay = new MapboxOverlay({ layers: [] });
const deckLayers = new Map<string, unknown>();
const deckAdapter = new DeckLayerAdapter(map, deckOverlay, deckLayers);

function updateOverlay(): void {
  deckOverlay.setProps({ layers: Array.from(deckLayers.values()) as any[] });
}

function addPathLayer(): void {
  const layerId = 'path-routes';
  const layer = new PathLayer<PathData>({
    id: layerId,
    data: routes,
    pickable: true,
    opacity: 0.8,
    widthScale: 20,
    widthMinPixels: 3,
    widthMaxPixels: 20,
    getPath: (d) => d.path,
    getColor: (d) => d.color,
    getWidth: 5,
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

  addPathLayer();
});
