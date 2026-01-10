import maplibregl from 'maplibre-gl';
import { MapboxOverlay } from '@deck.gl/mapbox';
import { GreatCircleLayer } from '@deck.gl/geo-layers';
import { LayerControl } from 'maplibre-gl-layer-control';
import 'maplibre-gl-layer-control/style.css';
import { DeckLayerAdapter } from '../../src/maplibre/adapters/DeckLayerAdapter';

interface FlightRoute {
  source: [number, number];
  target: [number, number];
  name: string;
}

// Flight routes from San Francisco to major cities
const flightRoutes: FlightRoute[] = [
  { source: [-122.4, 37.8], target: [-0.1, 51.5], name: 'SFO → London' },
  { source: [-122.4, 37.8], target: [139.7, 35.7], name: 'SFO → Tokyo' },
  { source: [-122.4, 37.8], target: [2.3, 48.9], name: 'SFO → Paris' },
  { source: [-122.4, 37.8], target: [114.2, 22.3], name: 'SFO → Hong Kong' },
  { source: [-122.4, 37.8], target: [151.2, -33.9], name: 'SFO → Sydney' },
  { source: [-122.4, 37.8], target: [-43.2, -22.9], name: 'SFO → Rio' },
  { source: [-122.4, 37.8], target: [37.6, 55.8], name: 'SFO → Moscow' },
  { source: [-122.4, 37.8], target: [28.0, -26.2], name: 'SFO → Johannesburg' },
];

const map = new maplibregl.Map({
  container: 'map',
  style: 'https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json',
  center: [-30, 30],
  zoom: 1.5,
});

map.addControl(new maplibregl.NavigationControl(), 'top-right');
map.addControl(new maplibregl.ScaleControl({ unit: 'metric' }), 'bottom-right');

const deckOverlay = new MapboxOverlay({ layers: [] });
const deckLayers = new Map<string, unknown>();
const deckAdapter = new DeckLayerAdapter(map, deckOverlay, deckLayers);

function updateOverlay(): void {
  deckOverlay.setProps({ layers: Array.from(deckLayers.values()) });
}

function addGreatCircleLayer(): void {
  const layerId = 'flight-routes';
  const layer = new GreatCircleLayer<FlightRoute>({
    id: layerId,
    data: flightRoutes,
    pickable: true,
    opacity: 0.8,
    getSourcePosition: (d) => d.source,
    getTargetPosition: (d) => d.target,
    getSourceColor: [0, 200, 255, 255],
    getTargetColor: [255, 100, 100, 255],
    getWidth: 2,
    widthMinPixels: 2,
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

  addGreatCircleLayer();
});
