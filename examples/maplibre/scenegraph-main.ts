import maplibregl from 'maplibre-gl';
import { MapboxOverlay } from '@deck.gl/mapbox';
import { ScenegraphLayer } from '@deck.gl/mesh-layers';
import { LayerControl } from 'maplibre-gl-layer-control';
import 'maplibre-gl-layer-control/style.css';
import { DeckLayerAdapter } from '../../src/maplibre/adapters/DeckLayerAdapter';

// Sample positions for glTF models
const modelPositions = [
  { coordinates: [-122.4, 37.8, 0], orientation: [0, 0, 90] },
  { coordinates: [-122.38, 37.79, 0], orientation: [0, 0, 180] },
  { coordinates: [-122.42, 37.78, 0], orientation: [0, 0, 270] },
  { coordinates: [-122.39, 37.81, 0], orientation: [0, 0, 0] },
  { coordinates: [-122.41, 37.77, 0], orientation: [0, 0, 45] },
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

let sizeScale = 500;

function updateOverlay(): void {
  deckOverlay.setProps({ layers: Array.from(deckLayers.values()) });
}

function addScenegraphLayer(): void {
  const layerId = 'scenegraph-layer';

  const layer = new ScenegraphLayer({
    id: layerId,
    data: modelPositions,
    scenegraph: 'https://raw.githubusercontent.com/KhronosGroup/glTF-Sample-Models/master/2.0/Duck/glTF-Binary/Duck.glb',
    getPosition: (d: { coordinates: number[] }) => d.coordinates as [number, number, number],
    getOrientation: (d: { orientation: number[] }) => d.orientation as [number, number, number],
    sizeScale,
    _lighting: 'pbr',
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
  addScenegraphLayer();
});

map.on('load', () => {
  map.addControl(deckOverlay as unknown as maplibregl.IControl);

  const layerControl = new LayerControl({
    collapsed: true,
    customLayerAdapters: [deckAdapter],
    panelWidth: 360,
  });
  map.addControl(layerControl as unknown as maplibregl.IControl, 'top-right');

  addScenegraphLayer();
});
