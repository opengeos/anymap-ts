import maplibregl from 'maplibre-gl';
import { MapboxOverlay } from '@deck.gl/mapbox';
import { S2Layer } from '@deck.gl/geo-layers';
import { LayerControl } from 'maplibre-gl-layer-control';
import 'maplibre-gl-layer-control/style.css';
import { DeckLayerAdapter } from '../../src/maplibre/adapters/DeckLayerAdapter';

// Sample S2 cell tokens (around San Francisco area)
const s2Data = [
  { token: '80858c', value: 100 },
  { token: '80858d', value: 200 },
  { token: '80858e', value: 150 },
  { token: '80858f', value: 300 },
  { token: '808590', value: 250 },
  { token: '808591', value: 180 },
  { token: '808594', value: 220 },
  { token: '808595', value: 270 },
];

const map = new maplibregl.Map({
  container: 'map',
  style: 'https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json',
  center: [-122.4, 37.75],
  zoom: 8,
  pitch: 45,
});

map.addControl(new maplibregl.NavigationControl(), 'top-right');
map.addControl(new maplibregl.ScaleControl({ unit: 'metric' }), 'bottom-right');

const deckOverlay = new MapboxOverlay({ layers: [] });
const deckLayers = new Map<string, unknown>();
const deckAdapter = new DeckLayerAdapter(map, deckOverlay, deckLayers);

let elevationScale = 100;

function updateOverlay(): void {
  deckOverlay.setProps({ layers: Array.from(deckLayers.values()) });
}

function addS2Layer(): void {
  const layerId = 's2-layer';

  const layer = new S2Layer({
    id: layerId,
    data: s2Data,
    getS2Token: (d: { token: string }) => d.token,
    getFillColor: [51, 136, 255, 180],
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
  addS2Layer();
});

map.on('load', () => {
  map.addControl(deckOverlay as unknown as maplibregl.IControl);

  const layerControl = new LayerControl({
    collapsed: true,
    customLayerAdapters: [deckAdapter],
    panelWidth: 360,
  });
  map.addControl(layerControl as unknown as maplibregl.IControl, 'top-right');

  addS2Layer();
});
