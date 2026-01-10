import maplibregl from 'maplibre-gl';
import { MapboxOverlay } from '@deck.gl/mapbox';
import { H3ClusterLayer } from '@deck.gl/geo-layers';
import { LayerControl } from 'maplibre-gl-layer-control';
import 'maplibre-gl-layer-control/style.css';
import { DeckLayerAdapter } from '../../src/maplibre/adapters/DeckLayerAdapter';

// Sample H3 cluster data (groups of H3 hexagons)
const h3ClusterData = [
  {
    hexIds: ['852830827ffffff', '85283082fffffff', '852830877ffffff'],
    value: 150,
  },
  {
    hexIds: ['8528308a7ffffff', '8528308afffffff', '8528308b7ffffff'],
    value: 200,
  },
  {
    hexIds: ['852830957ffffff', '85283095fffffff', '852830967ffffff'],
    value: 250,
  },
  {
    hexIds: ['8528309c7ffffff', '8528309cfffffff', '8528309d7ffffff'],
    value: 180,
  },
];

const map = new maplibregl.Map({
  container: 'map',
  style: 'https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json',
  center: [-122.4, 37.75],
  zoom: 9,
  pitch: 45,
});

map.addControl(new maplibregl.NavigationControl(), 'top-right');
map.addControl(new maplibregl.ScaleControl({ unit: 'metric' }), 'bottom-right');

const deckOverlay = new MapboxOverlay({ layers: [] });
const deckLayers = new Map<string, unknown>();
const deckAdapter = new DeckLayerAdapter(map, deckOverlay, deckLayers);

let elevationScale = 20;

function updateOverlay(): void {
  deckOverlay.setProps({ layers: Array.from(deckLayers.values()) });
}

function addH3ClusterLayer(): void {
  const layerId = 'h3cluster-layer';

  const layer = new H3ClusterLayer({
    id: layerId,
    data: h3ClusterData,
    getHexagons: (d: { hexIds: string[] }) => d.hexIds,
    getFillColor: [255, 100, 100, 180],
    getElevation: (d: { value: number }) => d.value,
    extruded: true,
    elevationScale,
    pickable: true,
  });

  deckLayers.set(layerId, layer);
  updateOverlay();
  deckAdapter.notifyLayerAdded(layerId);
}

// Setup elevation scale slider
const elevationSlider = document.getElementById('elevation') as HTMLInputElement;
const elevationValue = document.getElementById('elevationValue') as HTMLSpanElement;

elevationSlider?.addEventListener('input', () => {
  elevationScale = parseInt(elevationSlider.value, 10);
  elevationValue.textContent = elevationSlider.value;
  addH3ClusterLayer();
});

map.on('load', () => {
  map.addControl(deckOverlay as unknown as maplibregl.IControl);

  const layerControl = new LayerControl({
    collapsed: true,
    customLayerAdapters: [deckAdapter],
    panelWidth: 360,
  });
  map.addControl(layerControl as unknown as maplibregl.IControl, 'top-right');

  addH3ClusterLayer();
});
