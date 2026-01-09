import maplibregl from 'maplibre-gl';
import { MapboxOverlay } from '@deck.gl/mapbox';
import { ArcLayer } from '@deck.gl/layers';
import { LayerControl } from 'maplibre-gl-layer-control';
import 'maplibre-gl-layer-control/style.css';
import { DeckLayerAdapter } from '../../src/maplibre/adapters/DeckLayerAdapter';

interface ArcData {
  source: [number, number];
  target: [number, number];
  name: string;
}

const flights: ArcData[] = [
  { source: [-122.4194, 37.7749], target: [-73.9857, 40.7484], name: 'SF to NYC' },
  { source: [-122.4194, 37.7749], target: [-87.6298, 41.8781], name: 'SF to Chicago' },
  { source: [-122.4194, 37.7749], target: [-118.2437, 34.0522], name: 'SF to LA' },
];

const map = new maplibregl.Map({
  container: 'map',
  style: 'https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json',
  center: [-98.5795, 39.8283],
  zoom: 3,
  pitch: 30,
});

map.addControl(new maplibregl.NavigationControl(), 'top-right');
map.addControl(new maplibregl.ScaleControl({ unit: 'metric' }), 'bottom-right');

const deckOverlay = new MapboxOverlay({ layers: [] });
const deckLayers = new Map<string, unknown>();
const deckAdapter = new DeckLayerAdapter(map, deckOverlay, deckLayers);

function updateOverlay(): void {
  deckOverlay.setProps({ layers: Array.from(deckLayers.values()) });
}

function addArcLayer(): void {
  const layerId = 'arc-flights';
  const layer = new ArcLayer<ArcData>({
    id: layerId,
    data: flights,
    pickable: true,
    getWidth: 2,
    getHeight: 1,
    greatCircle: true,
    getSourcePosition: (d) => d.source,
    getTargetPosition: (d) => d.target,
    getSourceColor: [0, 128, 255, 255],
    getTargetColor: [255, 128, 0, 255],
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

  addArcLayer();
});
