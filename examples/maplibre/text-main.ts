import maplibregl from 'maplibre-gl';
import { MapboxOverlay } from '@deck.gl/mapbox';
import { TextLayer } from '@deck.gl/layers';
import { LayerControl } from 'maplibre-gl-layer-control';
import 'maplibre-gl-layer-control/style.css';
import { DeckLayerAdapter } from '../../src/maplibre/adapters/DeckLayerAdapter';

interface TextData {
  coordinates: [number, number];
  text: string;
  size: number;
  color: [number, number, number, number];
}

// Bay Area locations with labels
const locations: TextData[] = [
  { coordinates: [-122.4194, 37.7749], text: 'San Francisco', size: 24, color: [255, 255, 255, 255] },
  { coordinates: [-122.2711, 37.8044], text: 'Oakland', size: 20, color: [255, 255, 255, 255] },
  { coordinates: [-122.2727, 37.8716], text: 'Berkeley', size: 18, color: [255, 255, 255, 255] },
  { coordinates: [-122.0322, 37.3688], text: 'San Jose', size: 20, color: [255, 255, 255, 255] },
  { coordinates: [-122.4862, 37.7589], text: 'Golden Gate Bridge', size: 14, color: [255, 200, 100, 255] },
  { coordinates: [-122.3894, 37.6213], text: 'SFO Airport', size: 14, color: [100, 200, 255, 255] },
  { coordinates: [-122.2089, 37.7126], text: 'OAK Airport', size: 14, color: [100, 200, 255, 255] },
  { coordinates: [-122.4534, 37.8083], text: 'Alcatraz', size: 12, color: [255, 150, 150, 255] },
  { coordinates: [-122.4783, 37.8199], text: 'Sausalito', size: 14, color: [200, 255, 200, 255] },
  { coordinates: [-122.1430, 37.4419], text: 'Palo Alto', size: 16, color: [255, 255, 255, 255] },
  { coordinates: [-122.0819, 37.3861], text: 'Santa Clara', size: 14, color: [255, 255, 255, 255] },
  { coordinates: [-122.0574, 37.3894], text: 'Sunnyvale', size: 14, color: [255, 255, 255, 255] },
  { coordinates: [-122.0096, 37.5485], text: 'Fremont', size: 16, color: [255, 255, 255, 255] },
  { coordinates: [-122.2566, 37.5072], text: 'Hayward', size: 14, color: [255, 255, 255, 255] },
  { coordinates: [-122.3110, 37.5536], text: 'San Leandro', size: 14, color: [255, 255, 255, 255] },
];

const map = new maplibregl.Map({
  container: 'map',
  style: 'https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json',
  center: [-122.3, 37.6],
  zoom: 9,
});

map.addControl(new maplibregl.NavigationControl(), 'top-right');
map.addControl(new maplibregl.ScaleControl({ unit: 'metric' }), 'bottom-right');

const deckOverlay = new MapboxOverlay({ layers: [] });
const deckLayers = new Map<string, unknown>();
const deckAdapter = new DeckLayerAdapter(map, deckOverlay, deckLayers);

function updateOverlay(): void {
  deckOverlay.setProps({ layers: Array.from(deckLayers.values()) });
}

function addTextLayer(): void {
  const layerId = 'text-labels';
  const layer = new TextLayer<TextData>({
    id: layerId,
    data: locations,
    pickable: true,
    getPosition: (d) => d.coordinates,
    getText: (d) => d.text,
    getSize: (d) => d.size,
    getColor: (d) => d.color,
    getAngle: 0,
    getTextAnchor: 'middle',
    getAlignmentBaseline: 'center',
    fontFamily: 'Arial, sans-serif',
    fontWeight: 'bold',
    outlineWidth: 2,
    outlineColor: [0, 0, 0, 200],
    billboard: true,
    sizeUnits: 'pixels',
    sizeMinPixels: 10,
    sizeMaxPixels: 32,
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

  addTextLayer();
});
