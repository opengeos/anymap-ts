import maplibregl from 'maplibre-gl';
import { MapboxOverlay } from '@deck.gl/mapbox';
import { SimpleMeshLayer } from '@deck.gl/mesh-layers';
import { LayerControl } from 'maplibre-gl-layer-control';
import 'maplibre-gl-layer-control/style.css';
import { DeckLayerAdapter } from '../../src/maplibre/adapters/DeckLayerAdapter';

// Sample mesh data positions (locations for mesh instances)
const meshData = [
  { position: [-122.4, 37.8], color: [255, 140, 0, 255] },
  { position: [-122.38, 37.79], color: [0, 200, 255, 255] },
  { position: [-122.42, 37.78], color: [255, 100, 100, 255] },
  { position: [-122.39, 37.81], color: [100, 255, 100, 255] },
  { position: [-122.41, 37.77], color: [200, 100, 255, 255] },
];

const map = new maplibregl.Map({
  container: 'map',
  style: 'https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json',
  center: [-122.4, 37.79],
  zoom: 13,
  pitch: 60,
  bearing: -17,
});

map.addControl(new maplibregl.NavigationControl(), 'top-right');
map.addControl(new maplibregl.ScaleControl({ unit: 'metric' }), 'bottom-right');

const deckOverlay = new MapboxOverlay({ layers: [] });
const deckLayers = new Map<string, unknown>();
const deckAdapter = new DeckLayerAdapter(map, deckOverlay, deckLayers);

let sizeScale = 1000;

function updateOverlay(): void {
  deckOverlay.setProps({ layers: Array.from(deckLayers.values()) });
}

function addSimpleMeshLayer(): void {
  const layerId = 'simplemesh-layer';

  const layer = new SimpleMeshLayer({
    id: layerId,
    data: meshData,
    mesh: 'https://raw.githubusercontent.com/visgl/deck.gl-data/master/website/bart.obj',
    getPosition: (d: { position: number[] }) => d.position as [number, number],
    getColor: (d: { color: number[] }) => d.color as [number, number, number, number],
    sizeScale,
    pickable: true,
  });

  deckLayers.set(layerId, layer);
  updateOverlay();
  deckAdapter.notifyLayerAdded(layerId);
}

// Setup scale slider
const scaleSlider = document.getElementById('scale') as HTMLInputElement;
const scaleValue = document.getElementById('scaleValue') as HTMLSpanElement;

scaleSlider?.addEventListener('input', () => {
  sizeScale = parseInt(scaleSlider.value, 10);
  scaleValue.textContent = scaleSlider.value;
  addSimpleMeshLayer();
});

map.on('load', () => {
  map.addControl(deckOverlay as unknown as maplibregl.IControl);

  const layerControl = new LayerControl({
    collapsed: true,
    customLayerAdapters: [deckAdapter],
    panelWidth: 360,
  });
  map.addControl(layerControl as unknown as maplibregl.IControl, 'top-right');

  addSimpleMeshLayer();
});
